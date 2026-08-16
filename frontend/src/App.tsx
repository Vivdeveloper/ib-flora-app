import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './lib/CartContext'
import Home from './pages/Home'
import Products from './pages/Products'
import Subscriptions from './pages/Subscriptions'
import Deliveries from './pages/Deliveries'
import Cart from './pages/Cart'
import CheckoutPayment from './pages/CheckoutPayment'
import CheckoutComplete from './pages/CheckoutComplete'

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/deliveries" element={<Deliveries />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout/payment" element={<CheckoutPayment />} />
          <Route path="/checkout/complete" element={<CheckoutComplete />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}
