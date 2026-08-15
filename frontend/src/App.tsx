import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './lib/CartContext'
import Home from './pages/Home'
import Products from './pages/Products'
import Subscriptions from './pages/Subscriptions'
import Deliveries from './pages/Deliveries'
import Cart from './pages/Cart'

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
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}
