import React from 'react';
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>404 - Page Not Found</h1>
      <p style={{ marginBottom: '2rem' }}>The page you're looking for doesn't exist.</p>
      <Link to="/">
        <span style={{ 
          padding: '0.5rem 1rem', 
          background: '#4f46e5', 
          color: 'white',
          borderRadius: '0.25rem',
          textDecoration: 'none',
          cursor: 'pointer'
        }}>
          Go back to Home
        </span>
      </Link>
    </div>
  );
}
