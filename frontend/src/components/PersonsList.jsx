import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const PersonsList = () => {
  const [persons, setPersons] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPersons = async (page) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/persons?page=${page}`);
      setPersons(response.data.data);
      setTotalPages(Math.ceil(response.data.pagination.total / response.data.pagination.limit));
      setError(null);
    } catch (err) {
      setError('Error fetching data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons(currentPage);
  }, [currentPage]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      try {
        await axios.delete(`http://localhost:5000/api/persons/${id}`);
        fetchPersons(currentPage);
      } catch (err) {
        setError('Error deleting person');
        console.error('Error:', err);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-2xl mb-4">Persons List</h2>
      <div className="grid gap-4">
        {persons.map((person) => (
          <div key={person.id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-bold">{person.name}</h3>
            <p>Date of Birth: {new Date(person.dob).toLocaleDateString()}</p>
            <p>Phone: {person.phone_number}</p>
            <p>Bank Balance: ${Number(person.bank_balance).toFixed(2)}</p>
            <div className="mt-2 space-x-2">
              <Link 
                to={`/edit/${person.id}`}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(person.id)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-center space-x-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PersonsList;