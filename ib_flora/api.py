from urllib.parse import parse_qs, urlparse

import frappe
import frappe.sessions
from frappe import _
from frappe.utils import cint, flt, get_time, now_datetime


@frappe.whitelist(allow_guest=True)
def get_csrf_token():
	"""The storefront is a standalone SPA (no Jinja-rendered shell), so it has
	no page-embedded frappe.csrf_token like desk/website pages do. Any logged-in
	session (e.g. an Administrator also using Desk in the same browser) requires
	a matching X-Frappe-CSRF-Token on POST/PUT/DELETE, so the frontend fetches
	one here and attaches it to every request via an axios interceptor."""
	return frappe.sessions.get_csrf_token()


def _find_zone_for_pincode(pincode):
	pincode = (pincode or "").strip()
	if not pincode:
		return None

	zones = frappe.get_all(
		"Delivery Zone",
		filters={"pincodes": ["like", f"%{pincode}%"]},
		fields=[
			"name",
			"territory",
			"shipping_rule",
			"cutoff_time",
			"delivery_start",
			"delivery_end",
			"same_day_available",
			"is_active",
			"pincodes",
		],
	)
	for zone in zones:
		covered = [p.strip() for p in (zone.pincodes or "").split(",")]
		if pincode in covered:
			return zone
	return None


def _shipping_charges(shipping_rule_name):
	"""Return (delivery_charge, free_above_amount) from a Shipping Rule's conditions."""
	if not shipping_rule_name:
		return None, None

	shipping_rule = frappe.get_doc("Shipping Rule", shipping_rule_name)

	if shipping_rule.calculate_based_on == "Fixed":
		return shipping_rule.shipping_amount, None

	delivery_charge = None
	free_above_amount = None
	for condition in shipping_rule.conditions:
		if condition.shipping_amount:
			delivery_charge = condition.shipping_amount
		else:
			free_above_amount = condition.from_value

	return delivery_charge, free_above_amount


LEAF_ITEM_GROUPS = [
	"Puja Flowers",
	"Cut Flowers",
	"Garlands",
	"Bouquets",
	"Green Leaves",
	"Incense & Dhoop",
	"Puja Kits",
	"Brass Items",
	"Puja Thali",
]


@frappe.whitelist(allow_guest=True)
def get_category_summary():
	"""One roundtrip for the homepage category grid: a count + representative
	thumbnail per leaf Item Group, instead of the frontend firing two
	get_product_filter_data calls per category (18 requests for 9 categories).

	Thumbnail preference: a real photo uploaded via Desk to the Item Group's
	standard Image field wins if present (that's the whole point of using it);
	otherwise falls back to a representative Website Item's image."""
	summary = []
	for group in LEAF_ITEM_GROUPS:
		count = frappe.db.count("Website Item", {"item_group": group, "published": 1})

		group_image = frappe.db.get_value("Item Group", group, "image")

		thumbnail = group_image
		if not thumbnail:
			website_item = frappe.get_all(
				"Website Item",
				filters={"item_group": group, "published": 1},
				fields=["website_image"],
				order_by="ranking desc, creation asc",
				limit=1,
			)
			thumbnail = website_item[0].website_image if website_item else None

		summary.append({"item_group": group, "count": count, "thumbnail": thumbnail})
	return summary


HOMEPAGE_SLIDESHOW = "IB Flora Homepage Banners"


@frappe.whitelist(allow_guest=True)
def get_homepage_slideshow():
	"""Real photo per homepage banner slide, sourced from the standard
	Website Slideshow doctype (Website Slideshow Item.image) so it's editable
	via Desk -- same pattern as the category thumbnails on Item Group.image.
	Marketing copy details (badge, accent colour, second CTA) stay in the
	frontend; only the image and the fields Website Slideshow natively
	supports (heading/description/url) are sourced from here."""
	if not frappe.db.exists("Website Slideshow", HOMEPAGE_SLIDESHOW):
		return []

	return frappe.get_all(
		"Website Slideshow Item",
		filters={"parent": HOMEPAGE_SLIDESHOW},
		fields=["idx", "heading", "description", "image", "url"],
		order_by="idx",
	)


@frappe.whitelist(allow_guest=True)
def get_item_details(item_codes):
	"""Website display fields (image/route/name/uom) for a list of item codes.

	Needed because webshop.webshop.shopping_cart.cart.get_cart_quotation's
	decorate_quotation_doc() enriches items with these same fields, but they
	get silently dropped on JSON serialization since they aren't real fields
	on the Quotation Item doctype -- that enrichment is designed for
	webshop's server-rendered Jinja cart templates, not an API consumer."""
	if isinstance(item_codes, str):
		item_codes = frappe.parse_json(item_codes)

	rows = frappe.get_all(
		"Website Item",
		filters={"item_code": ["in", item_codes]},
		fields=["item_code", "web_item_name", "website_image", "route", "stock_uom"],
	)
	return {row.item_code: row for row in rows}


@frappe.whitelist(allow_guest=True)
def get_item_creation_dates(item_codes):
	"""Batch creation-timestamp lookup for the product grid's "Newest" sort.

	webshop.webshop.product_data_engine.query's field list is fixed and
	doesn't include `creation`, so this fills that one gap rather than
	reimplementing its whole query (filters, ranking, pagination) just to
	add one field."""
	if isinstance(item_codes, str):
		item_codes = frappe.parse_json(item_codes)

	rows = frappe.get_all(
		"Website Item",
		filters={"item_code": ["in", item_codes]},
		fields=["item_code", "creation"],
	)
	return {row.item_code: str(row.creation) for row in rows}


@frappe.whitelist(allow_guest=True)
def get_item_ratings(website_items):
	"""Average rating + review count per Website Item, from the standard
	Item Review doctype. Batched (one query for the whole product grid)
	rather than reusing webshop's own per-item get_item_reviews() helper,
	which is built for a single product page and fetches every review row.

	No reviews exist in this store yet, so this returns an empty dict today
	-- deliberately not fabricating star ratings. Real customer reviews
	(via webshop's own add_item_review) will show up here automatically."""
	if isinstance(website_items, str):
		website_items = frappe.parse_json(website_items)

	rows = frappe.get_all(
		"Item Review",
		filters={"website_item": ["in", website_items]},
		fields=["website_item", "rating"],
	)

	by_item = {}
	for row in rows:
		by_item.setdefault(row.website_item, []).append(row.rating or 0)

	return {
		website_item: {
			"average": round((sum(ratings) / len(ratings)) * 5, 1),
			"count": len(ratings),
		}
		for website_item, ratings in by_item.items()
	}


@frappe.whitelist()
def set_cart_notes(notes):
	"""Apply a single "special instructions" note to every item on the current
	cart Quotation. Quotation Item.additional_notes is the real standard field
	webshop's own update_cart() writes per-item (see its `additional_notes`
	param) -- there's just no single endpoint to set it cart-wide at once, so
	this reuses webshop's own cart-resolution helper to do that in one call."""
	from webshop.webshop.shopping_cart.cart import _get_cart_quotation

	quotation = _get_cart_quotation()
	for item in quotation.items:
		item.additional_notes = notes
	quotation.flags.ignore_permissions = True
	quotation.save()
	return {"ok": True}


@frappe.whitelist(allow_guest=True)
def check_delivery_zone(pincode):
	zone = _find_zone_for_pincode(pincode)
	if not zone:
		return {"zone_found": False}

	delivery_charge, free_above_amount = _shipping_charges(zone.shipping_rule)

	same_day_eligible = bool(
		zone.same_day_available and zone.cutoff_time and now_datetime().time() <= get_time(zone.cutoff_time)
	)

	return {
		"zone_found": True,
		"territory": zone.territory,
		"shipping_rule": zone.shipping_rule,
		"delivery_charge": delivery_charge,
		"free_above_amount": free_above_amount,
		"same_day_eligible": same_day_eligible,
		"is_active": bool(zone.is_active),
		"cutoff_time": str(zone.cutoff_time) if zone.cutoff_time else None,
		"delivery_start": str(zone.delivery_start) if zone.delivery_start else None,
		"delivery_end": str(zone.delivery_end) if zone.delivery_end else None,
	}


@frappe.whitelist()
def create_payment_request(sales_order):
	"""Start a Razorpay checkout for a Sales Order, entirely via the standard
	Payment Request -> Payments app machinery -- this just repackages its
	output as JSON for the SPA.

	erpnext.accounts.doctype.payment_request.payment_request.make_payment_request
	does most of the real work: it creates + submits the Payment Request and
	resolves the default Razorpay Payment Gateway Account.

	Two gaps needed a small amount of glue code, both still calling only
	Payments' own existing controller methods (no Razorpay SDK/API calls of
	our own):

	1. PaymentRequest.get_payment_url() -- called automatically from
	   before_submit() during the make_payment_request() above -- always
	   passes `order_id=self.name` (the Payment Request's own name) into
	   RazorpaySettings.get_payment_url(). That method only calls
	   create_order() (which actually hits Razorpay's Orders API) when
	   `order_id` is falsy: `if not kwargs.get("order_id"): create_order(...)`.
	   Since PaymentRequest always supplies a truthy one, create_order() is
	   silently skipped -- checkout.js ends up handed a Payment Request name
	   as "order_id" instead of a real Razorpay order, which Razorpay's
	   hosted checkout can't find and simply fails to render. This appears to
	   be a genuine bug in this order_id convention as it interacts with
	   Razorpay specifically (harmless for gateways that treat order_id as an
	   arbitrary echoed merchant reference). Worked around by calling
	   RazorpaySettings.get_payment_url() ourselves with the same kwargs
	   PaymentRequest.get_payment_url() builds, minus that one field, so it
	   actually creates a real order.
	2. That whole flow ends by returning a URL to Payments' own
	   server-rendered page (payments/templates/pages/razorpay_checkout.py),
	   meant for a full-page redirect -- there's no whitelisted method that
	   hands back those same checkout.js params as JSON. This storefront is a
	   headless SPA that opens Razorpay's checkout.js itself (see
	   CheckoutPayment.tsx), so this unpacks the same Integration Request
	   that Jinja page would have read from, instead of redirecting to it.
	"""
	from erpnext.accounts.doctype.payment_request.payment_request import make_payment_request

	# Revisiting this page (a reload, a dismissed Razorpay modal, React
	# StrictMode's double-effect in dev) must not create a second Payment
	# Request -- make_payment_request() itself throws "Payment Request is
	# already created" if one's already outstanding, so reuse it instead of
	# treating that as an error.
	existing_name = frappe.db.get_value(
		"Payment Request",
		{
			"reference_doctype": "Sales Order",
			"reference_name": sales_order,
			"docstatus": 1,
			"status": ["in", ["Draft", "Requested", "Initiated"]],
		},
		"name",
	)

	if existing_name:
		payment_request = frappe.get_doc("Payment Request", existing_name)
	else:
		payment_request = make_payment_request(
			dt="Sales Order",
			dn=sales_order,
			submit_doc=1,
			return_doc=1,
			mute_email=1,
		)

	integration_request = _razorpay_order_integration_request(payment_request)
	payment_details = frappe.parse_json(integration_request.data)

	return {
		"payment_request": payment_request.name,
		"token": integration_request.name,
		"key": frappe.db.get_single_value("Razorpay Settings", "api_key"),
		"order_id": payment_details.get("order_id"),
		"amount": cint(flt(payment_details.get("amount")) * 100),
		"currency": payment_details.get("currency"),
		"name": payment_details.get("title"),
		"description": payment_details.get("description"),
		"reference_doctype": payment_details.get("reference_doctype"),
		"reference_docname": payment_details.get("reference_docname"),
		"prefill": {
			"name": payment_details.get("payer_name"),
			"email": payment_details.get("payer_email"),
		},
	}


def _razorpay_order_integration_request(payment_request):
	"""Return the Integration Request holding a *real* Razorpay order for this
	Payment Request, creating one via RazorpaySettings.get_payment_url() if
	none exists yet. See create_payment_request()'s docstring for why this
	can't just read payment_request.payment_url directly."""
	existing = frappe.get_all(
		"Integration Request",
		filters={
			"reference_doctype": "Payment Request",
			"reference_docname": payment_request.name,
			"integration_request_service": "Razorpay",
		},
		fields=["name", "data"],
		order_by="creation desc",
	)
	for row in existing:
		if frappe.parse_json(row.data).get("order_id", "").startswith("order_"):
			return frappe.get_doc("Integration Request", row.name)

	ref = frappe.db.get_value(
		"Sales Order", payment_request.reference_name, ["company", "customer_name"], as_dict=True
	)
	controller = frappe.get_doc("Razorpay Settings")
	controller.validate_transaction_currency(payment_request.currency)

	payment_url = controller.get_payment_url(
		amount=flt(payment_request.grand_total, payment_request.precision("grand_total")),
		title=ref.company,
		description=payment_request.subject,
		reference_doctype="Payment Request",
		reference_docname=payment_request.name,
		payer_email=payment_request.email_to or frappe.session.user,
		payer_name=ref.customer_name,
		currency=payment_request.currency,
		payment_gateway=payment_request.payment_gateway,
	)
	token = parse_qs(urlparse(payment_url).query).get("token", [None])[0]
	if not token:
		frappe.throw(_("Could not start Razorpay checkout for this order."))
	return frappe.get_doc("Integration Request", token)
