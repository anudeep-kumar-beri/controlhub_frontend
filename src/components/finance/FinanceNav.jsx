import React from 'react';
import { NavLink } from 'react-router-dom';
import './FinanceNav.css';

export default function FinanceNav() {
  const links = [
    { to: '/finance', label: 'Dashboard' },
    { to: '/finance/accounts', label: 'Accounts' },
    { to: '/finance/investments', label: 'Investments' },
    { to: '/finance/income', label: 'Income' },
    { to: '/finance/expenses', label: 'Expenses' },
    { to: '/finance/loans', label: 'Loans' },
    { to: '/finance/master-sheet', label: 'Master Sheet' },
    { to: '/finance/audit', label: 'Audit/Export' },
    { to: '/finance/settings', label: 'Settings' },
  ];

  return (
    <nav className="finance-nav">
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} className={({ isActive }) => `finance-link ${isActive ? 'active' : ''}`}>
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
