// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PersonsList from './components/PersonsList';
import AddPerson from './components/AddPerson';
import EditPerson from './components/EditPerson';
import './App.css';

function App() {
  return (
    <Router>
      <div className="container mx-auto px-4 py-8">
        <nav className="bg-gray-800 p-4 rounded-lg mb-8">
          <ul className="flex space-x-6 text-white">
            <li>
              <Link to="/" className="hover:text-gray-300">View Persons</Link>
            </li>
            <li>
              <Link to="/add" className="hover:text-gray-300">Add Person</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<PersonsList />} />
          <Route path="/add" element={<AddPerson />} />
          <Route path="/edit/:id" element={<EditPerson />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;