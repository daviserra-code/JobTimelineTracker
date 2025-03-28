import React from 'react';
import { Link } from "wouter";

export default function Header() {
  return (
    <header style={{ 
      backgroundColor: '#4f46e5', 
      color: 'white', 
      padding: '1rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>JobTrack</h1>
        <nav>
          <ul style={{ 
            display: 'flex', 
            gap: '1.5rem', 
            listStyle: 'none', 
            margin: 0, 
            padding: 0 
          }}>
            <li>
              <Link to="/">
                <span style={{ color: 'white', textDecoration: 'none', cursor: 'pointer' }}>Home</span>
              </Link>
            </li>
            <li>
              <Link to="/dashboard-test">
                <span style={{ color: 'white', textDecoration: 'none', cursor: 'pointer' }}>Dashboard</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
