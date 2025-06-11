import React, { useState } from 'react';
import './Login.css';
import { FaUser, FaLock } from "react-icons/fa";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input
    if (!email || !password) {
      setError('Email and password are required'); // Verifies that there is input
      return;
    }

    try {
      const response = await fetch('http://localhost:3002/api/login', { // Calls API Request
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) { // If the Request is True, then user is redirected to the Dashboard tab
        const data = await response.json();
        window.location.href = '/dashboard';
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Login failed'); // If the response is not true, then the Login failed
      }
    } catch (err) {
      console.error('Fetch error:', err); // Log the error for debugging
      setError('An error occurred. Please try again later.');
    }
  };

  return (
    <div className='login-background' /* This is the background class name, which allows developers to modify the CSS properties*/>
      <div className='wrapper' /* The wrapper is the panel where the email and password text boxes will be displayed*/>
        <form onSubmit={handleSubmit} /* When the form is submitted it calls the function handleSubmit*/> 
          <h1>Login</h1>
          {error && <p className="error" /* Display error message */ >{error}</p>} 
          <div className='input-box'/*Input Box being displayed */> 
            <input 
              type='email' 
              placeholder='Email' 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} // Listens for any change in the input box to update the variable email 
              required 
            />
            <FaUser className='icon' /*Icon to make the login more intuitive and improve ease of usability */ />
          </div>
          <div className='input-box'>
            <input 
              type='password' 
              placeholder='Password' 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} // 
              required 
            />
            <FaLock className='icon' /*Another Icon to make the Login Page more intuitive*/ />
          </div>
          <button type='submit'>Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;