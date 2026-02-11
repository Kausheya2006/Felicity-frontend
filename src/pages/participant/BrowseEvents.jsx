import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEvents, getTrendingEvents } from '../../api/eventService';
import { getFollowedOrganizers, getMyRegistrations } from '../../api/participantService';
import Navbar from '../../components/Navbar';
import Card from '../../components/Card';
import Button from '../../components/Button';

const BrowseEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [followedOrganizers, setFollowedOrganizers] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // all, trending, followed
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    eligibility: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchTrending();
    fetchFollowedOrganizers();
    fetchMyRegistrations();
  }, []);

  const fetchEvents = async (customFilters = {}) => {
    try {
      const filterParams = { ...filters, ...customFilters };
      const cleanFilters = Object.fromEntries(
        Object.entries(filterParams).filter(([_, v]) => v !== '')
      );
      const data = await getAllEvents(cleanFilters);
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchTrending = async () => {
    try {
      const data = await getTrendingEvents();
      setTrendingEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching trending events:', error);
    }
  };

  const fetchFollowedOrganizers = async () => {
    try {
      const data = await getFollowedOrganizers();
      setFollowedOrganizers(data.followedOrganizers || []);
    } catch (error) {
      console.error('Error fetching followed organizers:', error);
    }
  };

  const fetchMyRegistrations = async () => {
    try {
      const data = await getMyRegistrations();
      setMyRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const isRegistered = (eventId) => {
    return myRegistrations.some(reg => 
      reg.eventId?._id === eventId && 
      (reg.status === 'CONFIRMED' || reg.status === 'PENDING')
    );
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const customFilters = {};
    if (activeFilter === 'followed' && followedOrganizers.length > 0) {
      customFilters.organizerIds = followedOrganizers.map(o => o._id).join(',');
    }
    fetchEvents(customFilters);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters();
  };

  const displayEvents = activeFilter === 'trending' ? trendingEvents : events;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Browse Events" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>👥 Team Events:</strong> Look for events with the "TEAM" badge. Click on them to create/join teams. 
            Visit <button onClick={() => navigate('/teams')} className="underline font-semibold hover:text-blue-900">Teams Dashboard</button> to manage your teams.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              onClick={() => {
                setActiveFilter('all');
                setFilters({
                  search: '',
                  type: '',
                  eligibility: '',
                  startDate: '',
                  endDate: ''
                });
                fetchEvents();
              }}
              variant={activeFilter === 'all' ? 'primary' : 'secondary'}
              size="sm"
            >
              All Events
            </Button>
            <Button
              onClick={() => {
                setActiveFilter('trending');
                setFilters({
                  search: '',
                  type: '',
                  eligibility: '',
                  startDate: '',
                  endDate: ''
                });
              }}
              variant={activeFilter === 'trending' ? 'primary' : 'secondary'}
              size="sm"
            >
              🔥 Trending (Top 5 / 24h)
            </Button>
            <Button
              onClick={() => {
                setActiveFilter('followed');
                setFilters({
                  search: '',
                  type: '',
                  eligibility: '',
                  startDate: '',
                  endDate: ''
                });
                if (followedOrganizers.length > 0) {
                  fetchEvents({ organizerIds: followedOrganizers.map(o => o._id).join(',') });
                } else {
                  fetchEvents();
                }
              }}
              variant={activeFilter === 'followed' ? 'primary' : 'secondary'}
              size="sm"
            >
              Followed Clubs {followedOrganizers.length > 0 && `(${followedOrganizers.length})`}
            </Button>
          </div>

          {/* Search and Filters */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search events or organizers..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="NORMAL">Normal</option>
                <option value="MERCH">Merchandise</option>
              </select>

              <select
                value={filters.eligibility}
                onChange={(e) => handleFilterChange('eligibility', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Eligibility</option>
                <option value="IIIT">IIIT Only</option>
                <option value="NON_IIIT">Non-IIIT</option>
              </select>

              <Button type="submit" variant="primary" className="w-full">
                Search
              </Button>
            </div>

            {/* Date Range Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date:</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date:</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Events List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayEvents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No events found</p>
            </div>
          ) : (
            displayEvents.map((event) => (
              <Card 
                key={event._id} 
                className={`hover:shadow-lg transition-shadow cursor-pointer ${
                  isRegistered(event._id) 
                    ? 'border-4 border-green-500' 
                    : ''
                }`}
              >
                <div onClick={() => navigate(`/events/${event._id}`)}>
                  {/* Registered Badge */}
                  {isRegistered(event._id) && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        ✓ Registered
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                    <div className="flex gap-2">
                      {event.allowTeams && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800" title={`Team event: ${event.minTeamSize}-${event.maxTeamSize} members`}>
                          👥 TEAM
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        event.type === 'MERCH' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {event.type}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-700">
                      <span className="font-medium mr-2">Organizer:</span>
                      <span>{event.organizerId?.organizerProfile?.name || 'N/A'}</span>
                    </div>
                    
                    {event.eventStartDate && (
                      <div className="flex items-center text-gray-700">
                        <span className="font-medium mr-2">Date:</span>
                        <span>{new Date(event.eventStartDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {event.venue && (
                      <div className="flex items-center text-gray-700">
                        <span className="font-medium mr-2">Venue:</span>
                        <span>{event.venue}</span>
                      </div>
                    )}
                    
                    {event.fee > 0 && (
                      <div className="flex items-center text-green-600 font-semibold">
                        <span className="mr-2">Fee:</span>
                        <span>${event.fee}</span>
                      </div>
                    )}
                    
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {activeFilter === 'trending' && event.registrationCount && (
                      <div className="flex items-center text-orange-600 font-semibold">
                        <span>🔥 {event.registrationCount} registrations (24h)</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <Button 
                      variant="primary" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/events/${event._id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default BrowseEvents;
