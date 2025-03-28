import React from 'react';
import { Link } from "wouter";

export default function Home() {
  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto', 
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        JobTrack - Activity Management
      </h1>
      
      <p style={{ marginBottom: '2rem' }}>
        A simple job activity management system for tracking your career journey.
      </p>
      
      <div style={{ 
        padding: '1rem', 
        background: '#f3f4f6', 
        borderRadius: '0.5rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Navigation Links</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/dashboard-test">
            <button style={{ 
              padding: '0.5rem 1rem', 
              background: '#4f46e5', 
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}>
              Dashboard Test
            </button>
          </Link>
          <a href="/api/dashboard/stats" target="_blank" style={{ 
            padding: '0.5rem 1rem', 
            background: '#374151', 
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            textDecoration: 'none'
          }}>
            View API Data
          </a>
        </div>
      </div>
      
      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        © 2025 JobTrack. All rights reserved.
      </p>
    </div>
  );
}
