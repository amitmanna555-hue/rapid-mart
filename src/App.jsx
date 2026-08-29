import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

function App() {
  const [viewMode, setViewMode] = useState('admin'); // 'admin', 'customer', ba 'rider'
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Rider Login State
  const [riderNameInput, setRiderNameInput] = useState('');
  const [currentRider, setCurrentRider] = useState(null);

  const [activeWorkers] = useState([
    { id: 1, name: 'Hasibul', role: 'Laborer / Rider', status: 'Available', earnings: 700 },
    { id: 2, name: 'Kamal', role: 'Laborer / Rider', status: 'On Delivery', earnings: 550 },
    { id: 3, name: 'Binoy Das', role: 'Booth Manager', status: 'At Hub', earnings: 800 },
    { id: 4, name: 'Manoj Singh', role: 'Booth Manager', status: 'At Hub', earnings: 800 }
  ]);

  const [inventory, setInventory] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemStock, setNewItemStock] = useState('');
  
  // Orders & Cart
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchOrders();
  }, []);

  const fetchInventory = async () => {
    const { data, error } = await supabase.from('inventory').select('*');
    if (!error) setInventory(data || []);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('orders').select('*');
    if (!error) setOrders(data || []);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice || !newItemStock) return;
    
    const { data, error } = await supabase
      .from('inventory')
      .insert([{ Name: newItemName, Price: parseInt(newItemPrice), stock: parseInt(newItemStock) }])
      .select();
      
    if (!error && data) {
      setInventory([...inventory, data[0]]);
      setNewItemName('');
      setNewItemPrice('');
      setNewItemStock('');
    }
  };

  const handleDeleteItem = async (id) => {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (!error) setInventory(inventory.filter(item => item.id !== id));
  };

  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!customerName || cart.length === 0) {
      alert("Please enter your name and add items to cart!");
      return;
    }

    const itemNames = cart.map(i => i.Name).join(', ');
    const totalAmount = cart.reduce((sum, i) => sum + i.Price, 0);

    const { data, error } = await supabase
      .from('orders')
      .insert([{ customer_name: customerName, items: itemNames, amount: totalAmount, status: 'Pending' }])
      .select();

    if (error) {
      alert("Order failed!");
    } else {
      alert("🎉 Order placed successfully! Rapid Mart 10-min delivery initiated.");
      setOrders([...orders, data[0]]);
      setCart([]);
      setCustomerName('');
    }
  };

  const handleNextOrderStage = async (id, currentStatus) => {
    let nextStatus = 'Pending';
    if (currentStatus === 'Pending') nextStatus = 'Packed';
    else if (currentStatus === 'Packed') nextStatus = 'Out for Delivery';
    else if (currentStatus === 'Out for Delivery') nextStatus = 'Delivered';

    const { error } = await supabase.from('orders').update({ status: nextStatus }).eq('id', id);
    if (!error) {
      setOrders(orders.map(o => o.id === id ? { ...o, status: nextStatus } : o));
    }
  };

  const handleRiderLogin = (e) => {
    e.preventDefault();
    if (!riderNameInput.trim()) return;
    setCurrentRider(riderNameInput.trim());
  };

  // 1. Customer Storefront View
  if (viewMode === 'customer') {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <header style={{ backgroundColor: '#0f172a', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ margin: 0, color: '#22c55e' }}>RAPID <span style={{ color: '#facc15' }}>MART</span> <span style={{ fontSize: '0.5em', color: '#cbd5e1' }}>Maheshtala Store</span></h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setViewMode('rider')} style={{ padding: '8px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85em' }}>
              Rider Portal 🛵
            </button>
            <button onClick={() => setViewMode('admin')} style={{ padding: '8px 15px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85em' }}>
              Admin Panel ⚙️
            </button>
          </div>
        </header>

        <div style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          <div>
            <h3>🛒 Available Groceries (10 Mins Delivery to Nuṅgī & Maheshtala)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px', marginTop: '15px' }}>
              {inventory.map(item => (
                <div key={item.id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>{item.Name}</h4>
                  <p style={{ color: '#166534', fontWeight: 'bold', margin: '0 0 10px 0' }}>₹{item.Price}</p>
                  <button onClick={() => addToCart(item)} style={{ width: '100%', padding: '8px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Add to Cart ➕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', height: 'fit-content' }}>
            <h3>🛍️ Your Cart</h3>
            {cart.length === 0 ? <p style={{ color: '#64748b' }}>Cart is empty</p> : (
              <div>
                {cart.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.9em' }}>
                    <span>{c.Name}</span>
                    <span style={{ fontWeight: 'bold' }}>₹{c.Price}</span>
                  </div>
                ))}
                <h4 style={{ margin: '15px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total:</span>
                  <span style={{ color: '#166534' }}>₹{cart.reduce((sum, i) => sum + i.Price, 0)}</span>
                </h4>
                <form onSubmit={handlePlaceOrder}>
                  <input 
                    type="text" 
                    placeholder="Your Full Name" 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                  <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Place Order Now 🚀
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Rider Delivery Portal View
  if (viewMode === 'rider') {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <header style={{ backgroundColor: '#0f172a', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: '#3b82f6' }}>RAPID <span style={{ color: '#facc15' }}>MART</span> <span style={{ fontSize: '0.5em', color: '#cbd5e1' }}>Rider Delivery App</span></h2>
          <button onClick={() => setViewMode('customer')} style={{ padding: '8px 15px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85em' }}>
            Go to Shop 🛍️
          </button>
        </header>

        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
          {!currentRider ? (
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
              <h3 style={{ color: '#0f172a', marginBottom: '10px' }}>🛵 Rider Login</h3>
              <p style={{ color: '#64748b', fontSize: '0.9em', marginBottom: '20px' }}>Enter your name (e.g., Hasibul, Kamal) to view deliveries</p>
              <form onSubmit={handleRiderLogin}>
                <input 
                  type="text" 
                  placeholder="Enter Rider Name" 
                  value={riderNameInput} 
                  onChange={(e) => setRiderNameInput(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }}
                />
                <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1em' }}>
                  Start Delivery Shift 🚀
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: 'white', padding: '15px 20px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a' }}>Welcome, {currentRider} 👋</h4>
                  <span style={{ fontSize: '0.8em', color: '#166534', fontWeight: 'bold' }}>● Active Delivery Partner</span>
                </div>
                <button onClick={() => setCurrentRider(null)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 'bold' }}>
                  Logout
                </button>
              </div>

              <h3 style={{ color: '#0f172a', marginBottom: '15px' }}>📦 Live Delivery Queue</h3>
              {orders.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '30px', backgroundColor: 'white', borderRadius: '10px' }}>No active orders in queue right now.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {orders.map(order => (
                    <div key={order.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '5px solid #3b82f6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Customer: {order.customer_name}</span>
                        <span style={{ backgroundColor: order.status === 'Delivered' ? '#dcfce7' : '#fee2e2', color: order.status === 'Delivered' ? '#166534' : '#991b1b', padding: '3px 8px', borderRadius: '5px', fontWeight: 'bold', fontSize: '0.75em' }}>
                          {order.status}
                        </span>
                      </div>
                      <p style={{ color: '#475569', fontSize: '0.9em', margin: '5px 0' }}><b>Items:</b> {order.items}</p>
                      <p style={{ color: '#166534', fontWeight: 'bold', margin: '5px 0 15px 0' }}>Amount: ₹{order.amount}</p>
                      
                      {order.status !== 'Delivered' && (
                        <button onClick={() => handleNextOrderStage(order.id, order.status)} style={{ width: '100%', padding: '10px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em' }}>
                          Advance Order Stage ➔ ({order.status === 'Pending' ? 'Mark Packed' : order.status === 'Packed' ? 'Out for Delivery' : 'Mark Delivered'})
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Admin Login View
  if (!session) {
    return (
      <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: "'Inter', sans-serif", padding: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
          <h2 style={{ color: '#0f172a', marginBottom: '5px', textAlign: 'center' }}>RAPID <span style={{ color: '#22c55e' }}>MART</span></h2>
          <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '25px', fontSize: '0.9em' }}>Admin Console & Customer Portal</p>
          
          {authError && <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.85em' }}>{authError}</div>}
          
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.85em', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85em', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <button type="submit" disabled={authLoading} style={{ width: '100%', padding: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1em', marginBottom: '10px' }}>
              {authLoading ? 'Signing in...' : 'Sign In to Console'}
            </button>
          </form>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setViewMode('customer')} style={{ flex: 1, padding: '10px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85em' }}>
              Customer Shop 🛍️
            </button>
            <button onClick={() => setViewMode('rider')} style={{ flex: 1, padding: '10px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85em' }}>
              Rider App 🛵
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Admin Dashboard View
  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', fontFamily: "'Inter', sans-serif", paddingBottom: '60px' }}>
      <header style={{ backgroundColor: '#0f172a', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0, color: '#22c55e', fontWeight: '900' }}>RAPID <span style={{ color: '#facc15' }}>MART</span> <span style={{ color: '#94a3b8', fontSize: '0.5em' }}>ADMIN CONSOLE</span></h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setViewMode('rider')} style={{ padding: '8px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85em' }}>
            Rider Portal 🛵
          </button>
          <button onClick={() => setViewMode('customer')} style={{ padding: '8px 12px', backgroundColor: '#eab308', color: '#0f172a', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85em' }}>
            Customer Shop 🛒
          </button>
          <button onClick={handleLogout} style={{ padding: '8px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85em' }}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1250px', margin: '30px auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          
          {/* Live Orders from Database */}
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>⚡ Live Cloud Orders (From Customer Shop)</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Customer</th>
                    <th style={{ padding: '10px' }}>Items</th>
                    <th style={{ padding: '10px' }}>Amount</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>No live orders found in cloud...</td></tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontWeight: '600' }}>{order.customer_name}</td>
                        <td style={{ padding: '10px', color: '#475569' }}>{order.items}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#166534' }}>₹{order.amount}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ backgroundColor: order.status === 'Delivered' ? '#dcfce7' : '#fee2e2', color: order.status === 'Delivered' ? '#166534' : '#991b1b', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8em' }}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          {order.status !== 'Delivered' && (
                            <button onClick={() => handleNextOrderStage(order.id, order.status)} style={{ padding: '5px 10px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8em' }}>
                              Advance ➔
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Workforce Ledger */}
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>👥 Workforce Ledger</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Name</th>
                  <th style={{ padding: '8px' }}>Role</th>
                  <th style={{ padding: '8px' }}>Payout</th>
                </tr>
              </thead>
              <tbody>
                {activeWorkers.map(w => (
                  <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontWeight: '600' }}>{w.name}</td>
                    <td style={{ padding: '8px', color: '#64748b' }}>{w.role}</td>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>₹{w.earnings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Inventory Control */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#0f172a' }}>📦 Rapid Mart Inventory Manager</h3>
          <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Product Name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} style={{ padding: '12px', flex: 2, minWidth: '180px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
            <input type="number" placeholder="Price (₹)" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} style={{ padding: '12px', flex: 1, minWidth: '100px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
            <input type="number" placeholder="Stock Units" value={newItemStock} onChange={(e) => setNewItemStock(e.target.value)} style={{ padding: '12px', flex: 1, minWidth: '100px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
            <button type="submit" style={{ padding: '12px 25px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Add SKU</button>
          </form>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85em', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Product Name</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Unit Price</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Stock Level</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{item.Name}</td>
                    <td style={{ padding: '12px', color: '#166534', fontWeight: 'bold' }}>₹{item.Price}</td>
                    <td style={{ padding: '12px' }}>{item.stock} units</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button onClick={() => handleDeleteItem(item.id)} style={{ padding: '6px 12px', backgroundColor: '#fff', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;