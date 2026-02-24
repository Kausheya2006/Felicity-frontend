import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEvents, getTrendingEvents } from '../../api/eventService';
import { getFollowedOrganizers, getMyRegistrations } from '../../api/participantService';
import { authService } from '../../api/authService';
import Navbar from '../../components/Navbar';
import Card from '../../components/Card';
import Button from '../../components/Button';

const BrowseEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [followedOrganizers, setFollowedOrganizers] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [myInterests, setMyInterests] = useState([]); 
  const [activeFilter, setActiveFilter] = useState('all'); // all, trending, followed, preferential
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
    fetchMyProfile(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMyProfile = async () => {
    try {
      const me = await authService.getCurrentUser();
      const interests = me?.participantProfile?.interests || [];
      setMyInterests(Array.isArray(interests) ? interests : []);
    } catch (error) {
      console.error('Error fetching current user:', error);
      setMyInterests([]);
    }
  };

  const fetchEvents = async (customFilters = {}) => {
    try {
      const filterParams = { ...filters, ...customFilters };
      const cleanFilters = Object.fromEntries(Object.entries(filterParams).filter(([_, v]) => v !== ''));
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
    return myRegistrations.some((reg) => {
      const regEventId = reg.eventId?._id || reg.eventId;
      return regEventId === eventId && (reg.status === 'CONFIRMED' || reg.status === 'PENDING');
    });
  };

  const isPastEvent = (event) => {
    const raw = event.eventEndDate || event.eventStartDate;
    if (!raw) return false;

    const d = new Date(raw);
    if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      d.setHours(23, 59, 59, 999);
    }
    return d < new Date();
  };

  const isOrganizerMissing = (event) => {
    return !event.organizerId || !event.organizerId.organizerProfile?.name;
  };

  const norm = (s) => (s || '').toString().trim().toLowerCase();

  const getInterestScore = (event) => {
    const interestSet = new Set((myInterests || []).map(norm).filter(Boolean));
    const tags = (event.tags || []).map(norm).filter(Boolean);

    let score = 0;
    for (const t of tags) if (interestSet.has(t)) score += 1;
    return score; // 0..N
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const customFilters = {};
    if (activeFilter === 'followed' && followedOrganizers.length > 0) {
      customFilters.organizerIds = followedOrganizers.map((o) => o._id).join(',');
    }
    fetchEvents(customFilters);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters();
  };

  // Base sorting: non-past first, followed org first, then by start date
  const getSortedEvents = (eventsList) => {
    if (!eventsList) return [];
    const followedOrgIds = followedOrganizers.map((o) => o._id);

    return [...eventsList].sort((a, b) => {
      const aIsPast = isPastEvent(a);
      const bIsPast = isPastEvent(b);
      if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;

      const aIsFollowed = followedOrgIds.includes(a.organizerId?._id);
      const bIsFollowed = followedOrgIds.includes(b.organizerId?._id);
      if (aIsFollowed !== bIsFollowed) return aIsFollowed ? -1 : 1;

      return new Date(a.eventStartDate) - new Date(b.eventStartDate);
    });
  };

  // Preferential sort: non-past first, then interest score, then date
  const sortPreferential = (eventsList) => {
    return [...eventsList].sort((a, b) => {
      const aIsPast = isPastEvent(a);
      const bIsPast = isPastEvent(b);
      if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;

      const aScore = getInterestScore(a);
      const bScore = getInterestScore(b);
      if (aScore !== bScore) return bScore - aScore;

      return new Date(a.eventStartDate) - new Date(b.eventStartDate);
    });
  };

  const getDisplayEvents = () => {
    if (activeFilter === 'trending') return trendingEvents;

    const baseSorted = getSortedEvents(events);

    if (activeFilter === 'followed' && followedOrganizers.length > 0) {
      const followedIds = followedOrganizers.map((o) => o._id);
      return baseSorted.filter((e) => followedIds.includes(e.organizerId?._id));
    }

    if (activeFilter === 'followed' && followedOrganizers.length === 0) return [];

    if (activeFilter === 'preferential') return sortPreferential(baseSorted);

    return baseSorted;
  };

  const displayEvents = getDisplayEvents();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Browse Events" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Team Events:</strong> Look for events with the "TEAM" badge. Click on them to create/join teams.
            Visit{' '}
            <button onClick={() => navigate('/teams')} className="underline font-semibold hover:text-blue-900">
              Teams Dashboard
            </button>{' '}
            to manage your teams.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              onClick={() => {
                setActiveFilter('all');
                setFilters({ search: '', type: '', eligibility: '', startDate: '', endDate: '' });
                fetchEvents();
              }}
              variant={activeFilter === 'all' ? 'primary' : 'secondary'}
              size="sm"
            >
              All Events
            </Button>

            <Button
              onClick={() => {
                setActiveFilter('preferential');
                setFilters({ search: '', type: '', eligibility: '', startDate: '', endDate: '' });
                fetchEvents();
              }}
              variant={activeFilter === 'preferential' ? 'primary' : 'secondary'}
              size="sm"
              title={myInterests.length ? `Using your interests: ${myInterests.join(', ')}` : 'No interests found'}
            >
              Preferential
            </Button>

            <Button
              onClick={() => {
                setActiveFilter('trending');
                setFilters({ search: '', type: '', eligibility: '', startDate: '', endDate: '' });
              }}
              variant={activeFilter === 'trending' ? 'primary' : 'secondary'}
              size="sm"
            >
              Trending (Top 5 / 24h)
            </Button>

            <Button
              onClick={() => {
                setActiveFilter('followed');
                setFilters({ search: '', type: '', eligibility: '', startDate: '', endDate: '' });
                if (followedOrganizers.length > 0) {
                  fetchEvents({ organizerIds: followedOrganizers.map((o) => o._id).join(',') });
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {displayEvents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No events found</p>
            </div>
          ) : (
            displayEvents.map((event) => {
              const past = isPastEvent(event);
              const registered = isRegistered(event._id);
              const orgMissing = isOrganizerMissing(event);
              const score = activeFilter === 'preferential' ? getInterestScore(event) : 0;
              const limitReached = event.maxParticipants && event.currentRegistrations >= event.maxParticipants;

              const cardClass = [
                'hover:shadow-lg transition-shadow',
                'h-full flex flex-col',
                orgMissing ? 'bg-red-50 border-2 border-red-400' : '',
                !orgMissing && past ? 'bg-yellow-50 border-2 border-yellow-300 opacity-60' : '',
                registered ? 'border-2 border-green-500' : '',
                orgMissing ? 'cursor-not-allowed' : 'cursor-pointer'
              ].join(' ');

              return (
                <Card key={event._id} className={cardClass}>
                  <div
                    className="flex flex-col flex-1"
                    onClick={() => {
                      if (!orgMissing) navigate(`/events/${event._id}`);
                    }}
                  >
                    <div className="flex-1">
                      {orgMissing && (
                        <div className="mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-900">
                            ⚠ Organizer not found
                          </span>
                        </div>
                      )}

                      {past && !orgMissing && (
                        <div className="mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            Past Event
                          </span>
                        </div>
                      )}

                      {registered && (
                        <div className="mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            ✓ Registered
                          </span>
                        </div>
                      )}

                      {limitReached && !registered && (
                        <div className="mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            ⚠ Registration limit reached
                          </span>
                        </div>
                      )}

                      {/* Optional: show why it ranks higher */}
                      {activeFilter === 'preferential' && score > 0 && (
                        <div className="mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                            Matched interests: {score}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                        <div className="flex gap-2">
                          {event.allowTeams && (
                            <span
                              className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"
                              title={`Team event: ${event.minTeamSize}-${event.maxTeamSize} members`}
                            >
                              TEAM
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              event.type === 'MERCH' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {event.type}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-700">
                          <span className="font-medium mr-2">Organizer:</span>
                          <span className={orgMissing ? 'text-red-700 font-semibold' : ''}>
                            {event.organizerId?.organizerProfile?.name || 'N/A'}
                          </span>
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
                            <span>₹{event.fee}</span>
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
                            <span>{event.registrationCount} registrations (24h)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button
                        variant="primary"
                        className="w-full"
                        disabled={orgMissing}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!orgMissing) navigate(`/events/${event._id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default BrowseEvents;