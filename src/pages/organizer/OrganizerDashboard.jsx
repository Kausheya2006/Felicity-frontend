import React from 'react'
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createEvent, getMyEvents, editEvent, publishEvent, changeEventStatus, getEventRegistrations, getEventAnalytics, getProfile, updateProfile, getPaymentApprovals, approvePayment, rejectPayment } from '../../api/organizerService';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Card from '../../components/Card';
import FeedbackViewer from '../../components/FeedbackViewer';

// Datetime helper functions for datetime-local inputs
const toDatetimeLocal = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const nowLocal = () => toDatetimeLocal(new Date());

const OrganizerDashboard = () => {

    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('events');
    const [myEvents, setMyEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(null);
    const [eventForm, setEventForm] = useState({
        title: '',
        description: '',
        type: 'NORMAL',
        eventStartDate: nowLocal(),
        eventEndDate: nowLocal(),
        venue: '',
        maxParticipants: '',
        registrationDeadline: '', // keep empty; will auto-fill on submit
        eligibility: [],
        fee: 0,
        merchandiseFee: 0,
        tags: '',
        formSchema: [],
        // Merchandise fields
        items: [],
        // Team registration fields
        allowTeams: false,
        minTeamSize: 2,
        maxTeamSize: 5
    });

    // Draft state for merchandise items
    const [draftItem, setDraftItem] = useState({
        name: "",
        sku: "",
        purchaseLimitPerUser: "",
        variants: []
    });

    const [draftVariant, setDraftVariant] = useState({
        size: "",
        color: "",
        stock: ""
    });

    // Profile state
    const [profileData, setProfileData] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Payment approvals state
    const [paymentApprovals, setPaymentApprovals] = useState([]);
    const [selectedPaymentEvent, setSelectedPaymentEvent] = useState(null);
    const [paymentFilter, setPaymentFilter] = useState('PENDING');
    const [selectedPaymentProof, setSelectedPaymentProof] = useState(null);

    // Feedback state
    const [showFeedbackViewer, setShowFeedbackViewer] = useState(null);

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
        const data = await getMyEvents();
        setMyEvents(data);
        } catch (error) {
        console.error('Error fetching events:', error);
        }
    };

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setProfileData(data.user);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({
        organizerProfile: {
          name: profileData.organizerProfile.name,
          category: profileData.organizerProfile.category,
          description: profileData.organizerProfile.description,
          contactEmail: profileData.organizerProfile.contactEmail,
          contactNumber: profileData.organizerProfile.contactNumber,
          discordWebhook: profileData.organizerProfile.discordWebhook
        }
      });
      alert('Profile updated successfully!');
      setIsEditingProfile(false);
      fetchProfile();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const fetchEventRegistrations = async (eventId) => {
    try {
      const data = await getEventRegistrations(eventId);
      setRegistrations(data.registrations || data); // Handle both new and old response formats
      if (data.event) {
        // Update selectedEvent with full event data including formSchema
        setSelectedEvent(data.event);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const fetchEventAnalytics = async (eventId) => {
    setAnalytics(null); // Reset to trigger loading state
    try {
      const data = await getEventAnalytics(eventId);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set empty analytics instead of leaving as null
      setAnalytics({ analytics: {} });
    }
  };

  const fetchPaymentApprovals = async (eventId, status = null) => {
    try {
      const data = await getPaymentApprovals(eventId, status);
      setPaymentApprovals(data.registrations || []);
    } catch (error) {
      console.error('Error fetching payment approvals:', error);
    }
  };

  const handleApprovePayment = async (registrationId) => {
    if (!window.confirm('Are you sure you want to approve this payment? This will decrement stock and generate the ticket.')) return;
    
    try {
      await approvePayment(registrationId);
      alert('Payment approved successfully! Ticket generated.');
      if (selectedPaymentEvent) {
        fetchPaymentApprovals(selectedPaymentEvent, paymentFilter);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve payment');
    }
  };

  const handleRejectPayment = async (registrationId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      await rejectPayment(registrationId, reason);
      alert('Payment rejected successfully.');
      if (selectedPaymentEvent) {
        fetchPaymentApprovals(selectedPaymentEvent, paymentFilter);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject payment');
    }
  };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
        // Client-side validation: reg deadline must be before event end date
        if (eventForm.registrationDeadline && eventForm.eventEndDate) {
            if (new Date(eventForm.registrationDeadline) > new Date(eventForm.eventEndDate)) {
                alert('Registration Deadline must be before or on the Event End Date.');
                return;
            }
        }
        const eventData = {
            ...eventForm,
            maxParticipants: eventForm.maxParticipants ? parseInt(eventForm.maxParticipants, 10) : undefined,
            fee: eventForm.fee ? parseFloat(eventForm.fee) : 0,
            merchandiseFee: eventForm.merchandiseFee ? parseFloat(eventForm.merchandiseFee) : 0,
            tags: eventForm.tags ? eventForm.tags.split(',').map(t => t.trim()).filter(t => t) : [],
            // Only include registrationDeadline if explicitly set, otherwise let backend use eventStartDate
            registrationDeadline: eventForm.registrationDeadline || undefined
        };
        await createEvent(eventData);
        alert('Event created successfully!');
        setShowCreateForm(false);
        setEventForm({
            title: '',
            description: '',
            type: 'NORMAL',
            eventStartDate: nowLocal(),
            eventEndDate: nowLocal(),
            venue: '',
            maxParticipants: '',
            registrationDeadline: '',
            eligibility: [],
            fee: 0,
            merchandiseFee: 0,
            tags: '',
            formSchema: [],
            items: [],
            allowTeams: false,
            minTeamSize: 2,
            maxTeamSize: 5
        });
        setDraftItem({
            name: "",
            sku: "",
            purchaseLimitPerUser: "",
            variants: []
        });
        setDraftVariant({
            size: "",
            color: "",
            stock: ""
        });
        fetchMyEvents();
        } catch (error) {
        alert(error.response?.data?.message || 'Failed to create event');
        }
    };

  const handleEditEvent = async (eventId, updates) => {
    try {
      await editEvent(eventId, updates);
      alert('Event updated successfully!');
      setShowEditForm(null);
      fetchMyEvents();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update event');
    }
  };

  const handlePublishEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to publish this event?')) return;
    
    try {
      await publishEvent(eventId);
      alert('Event published successfully!');
      fetchMyEvents();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to publish event');
    }
  };

  const handleChangeStatus = async (eventId, newStatus) => {
    try {
      await changeEventStatus(eventId, newStatus);
      alert(`Event status changed to ${newStatus}!`);
      fetchMyEvents();
    } catch (error) {
      alert('Failed to change event status');
    }
  };

  const handleViewRegistrations = (event) => {
    setSelectedEvent(event);
    setActiveTab('registrations');
    fetchEventRegistrations(event._id);
  };

  const handleViewAnalytics = (event) => {
    setSelectedEvent(event);
    setActiveTab('analytics');
    fetchEventAnalytics(event._id);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Organizer Dashboard" />

      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('events')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'events'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Events
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'create'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create Event
            </button>
            <button
              onClick={() => {
                setActiveTab('registrations');
                setSelectedEvent(null);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'registrations'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Registrations
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => {
                setActiveTab('payments');
                setSelectedPaymentEvent(null);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'payments'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Approvals
            </button>
            <button
              onClick={() => {
                setActiveTab('profile');
                if (!profileData) {
                  fetchProfile();
                }
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile
            </button>
          </div>
        </div>
      </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* MY EVENTS */}
        {activeTab === 'events' && (
          <Card title="My Events">
            {myEvents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">You haven't created any events yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Participants</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {myEvents.map((event) => (
                      <tr key={event._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{event.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.venue}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            event.type === 'MERCH' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {event.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 
                            event.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {event.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.maxParticipants || 'Unlimited'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {/* View button - only for Published, Ongoing, Completed events */}
                          {['PUBLISHED', 'ONGOING', 'COMPLETED', 'CLOSED'].includes(event.status) && (
                            <Button onClick={() => navigate(`/events/${event._id}`)} size="sm" variant="secondary">View</Button>
                          )}
                          
                          {/* Draft events - full edit access */}
                          {event.status === 'DRAFT' && (
                            <>
                              <Button onClick={() => setShowEditForm(event)} size="sm" variant="info">Edit</Button>
                              <Button onClick={() => handlePublishEvent(event._id)} size="sm" variant="success">Publish</Button>
                              <Button onClick={() => handleChangeStatus(event._id, 'CANCELLED')} size="sm" variant="danger">Delete</Button>
                            </>
                          )}
                          
                          {/* Published events - limited edit, can view registrations */}
                          {event.status === 'PUBLISHED' && (
                            <>
                              <Button onClick={() => setShowEditForm({...event, isPublished: true})} size="sm" variant="info">Edit</Button>
                              <Button onClick={() => handleViewRegistrations(event)} size="sm" variant="info">Registrations</Button>
                              <Button onClick={() => handleViewAnalytics(event)} size="sm" variant="purple">Analytics</Button>
                              <Button onClick={() => setShowFeedbackViewer(event)} size="sm" variant="success">Feedback</Button>
                              <Button onClick={() => handleChangeStatus(event._id, 'ONGOING')} size="sm" variant="warning">Start Event</Button>
                              <Button onClick={() => handleChangeStatus(event._id, 'CANCELLED')} size="sm" variant="danger">Cancel</Button>
                            </>
                          )}
                          
                          {/* Ongoing events - status change only */}
                          {event.status === 'ONGOING' && (
                            <>
                              <Button onClick={() => handleViewRegistrations(event)} size="sm" variant="info">Registrations</Button>
                              <Button onClick={() => handleViewAnalytics(event)} size="sm" variant="purple">Analytics</Button>
                              <Button onClick={() => setShowFeedbackViewer(event)} size="sm" variant="success">Feedback</Button>
                              <Button onClick={() => handleChangeStatus(event._id, 'COMPLETED')} size="sm" variant="success">Complete</Button>
                              <Button onClick={() => handleChangeStatus(event._id, 'CLOSED')} size="sm" variant="warning">Close</Button>
                            </>
                          )}
                          
                          {/* Completed/Closed events - view only */}
                          {['COMPLETED', 'CLOSED'].includes(event.status) && (
                            <>
                              <Button onClick={() => handleViewRegistrations(event)} size="sm" variant="info">Registrations</Button>
                              <Button onClick={() => handleViewAnalytics(event)} size="sm" variant="purple">Analytics</Button>
                              <Button onClick={() => setShowFeedbackViewer(event)} size="sm" variant="success">Feedback</Button>
                            </>
                          )}
                          
                          {/* Cancelled events - no actions */}
                          {event.status === 'CANCELLED' && (
                            <span className="text-gray-400 italic">No actions available</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
             {/* Edit Form */}
            {showEditForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Edit Event: {showEditForm.title}
                    {showEditForm.isPublished && (
                      <span className="ml-2 text-sm font-normal text-orange-600">(Limited editing for published events)</span>
                    )}
                  </h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const updates = Object.fromEntries(formData);
                    // Clean up empty strings
                    Object.keys(updates).forEach(key => {
                      if (updates[key] === '') {
                        updates[key] = undefined;
                      }
                    });
                    // Validate reg deadline vs event end date
                    const deadline = updates.registrationDeadline;
                    const endDate = updates.eventEndDate || showEditForm.eventEndDate;
                    if (deadline && endDate && new Date(deadline) > new Date(endDate)) {
                      alert('Registration Deadline must be before or on the Event End Date.');
                      return;
                    }
                    // Parse numeric values
                    if (updates.maxParticipants) {
                      updates.maxParticipants = parseInt(updates.maxParticipants, 10);
                    }
                    handleEditEvent(showEditForm._id, updates);
                  }} className="space-y-4">
                    {/* Title - only editable for draft */}
                    {!showEditForm.isPublished && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title:</label>
                        <input 
                          name="title" 
                          defaultValue={showEditForm.title} 
                          required 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    )}
                    
                    {/* Description - always editable */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description:</label>
                      <textarea 
                        name="description" 
                        defaultValue={showEditForm.description}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* Venue - only editable for draft */}
                    {!showEditForm.isPublished && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Venue:</label>
                        <input 
                          name="venue" 
                          defaultValue={showEditForm.venue}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    )}
                    
                    {/* Max Participants - can increase for published */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Participants:
                        {showEditForm.isPublished && <span className="text-xs text-gray-500 ml-1">(can only increase)</span>}
                      </label>
                      <input 
                        type="number" 
                        name="maxParticipants" 
                        defaultValue={showEditForm.maxParticipants}
                        min={showEditForm.isPublished ? showEditForm.maxParticipants : undefined}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* Registration Deadline - can extend for published */}
                    {showEditForm.isPublished && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Registration Deadline:
                          <span className="text-xs text-gray-500 ml-1">(can only extend)</span>
                        </label>
                        <input 
                          type="datetime-local" 
                          name="registrationDeadline" 
                          defaultValue={showEditForm.registrationDeadline ? toDatetimeLocal(new Date(showEditForm.registrationDeadline)) : ''}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      <Button type="submit" variant="success" className="flex-1">Update</Button>
                      <Button type="button" onClick={() => setShowEditForm(null)} variant="secondary" className="flex-1">Cancel</Button>
                    </div>
                  </form>
                </Card>
              </div>
            )}
          </Card>
        )}
 {/* CREATE EVENT */}
        {activeTab === 'create' && (
          <Card title="Create New Event">
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title:</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description:</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type:</label>
                  <select
                    value={eventForm.type}
                    onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="MERCH">Merchandise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Start Date:</label>
                  <input
                    type="datetime-local"
                    value={eventForm.eventStartDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventStartDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Click the field to select date, then time
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event End Date:</label>
                  <input
                    type="datetime-local"
                    value={eventForm.eventEndDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventEndDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Deadline (Optional):
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.registrationDeadline}
                    onChange={(e) => setEventForm({ ...eventForm, registrationDeadline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If not set, registrations will close when the event starts
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue:</label>
                  <input
                    type="text"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Limit:</label>
                  <input
                    type="number"
                    value={eventForm.maxParticipants}
                    onChange={(e) => setEventForm({ ...eventForm, maxParticipants: e.target.value })}
                    placeholder="Leave empty for unlimited"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Fee (₹) <span className="text-gray-400 font-normal">(base fee per participant)</span>:</label>
                  <input
                    type="number"
                    step="1"
                    value={eventForm.fee}
                    onChange={(e) => setEventForm({ ...eventForm, fee: e.target.value })}
                    placeholder="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {eventForm.type === 'MERCH' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Per-Item Merchandise Fee (₹) <span className="text-gray-400 font-normal">(per merch item purchased)</span>:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={eventForm.merchandiseFee}
                      onChange={(e) => setEventForm({ ...eventForm, merchandiseFee: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {eventForm.fee > 0 && eventForm.merchandiseFee > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        No merch: ₹{eventForm.fee} | With 1 item: ₹{parseFloat(eventForm.fee) + parseFloat(eventForm.merchandiseFee)} | Example (2 items): ₹{parseFloat(eventForm.fee) + 2 * parseFloat(eventForm.merchandiseFee)}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Tags (comma-separated):</label>
                  <input
                    type="text"
                    value={eventForm.tags}
                    onChange={(e) => setEventForm({ ...eventForm, tags: e.target.value })}
                    placeholder="e.g., workshop, tech, networking"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Eligibility:</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={eventForm.eligibility.includes('IIIT')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEventForm({ ...eventForm, eligibility: [...eventForm.eligibility, 'IIIT'] });
                        } else {
                          setEventForm({ ...eventForm, eligibility: eventForm.eligibility.filter(el => el !== 'IIIT') });
                        }
                      }}
                      className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">IIIT Students</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={eventForm.eligibility.includes('NON_IIIT')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEventForm({ ...eventForm, eligibility: [...eventForm.eligibility, 'NON_IIIT'] });
                        } else {
                          setEventForm({ ...eventForm, eligibility: eventForm.eligibility.filter(el => el !== 'NON_IIIT') });
                        }
                      }}
                      className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Non-IIIT Students</span>
                  </label>
                </div>
              </div>

              {/* Team Registration Settings */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Team Registration</h3>
                    <p className="text-sm text-gray-600">Enable team-based registration for hackathons and group events</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventForm.allowTeams}
                      onChange={(e) => setEventForm({ ...eventForm, allowTeams: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {eventForm.allowTeams && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Team Size *</label>
                      <input
                        type="number"
                        min="2"
                        value={eventForm.minTeamSize}
                        onChange={(e) => setEventForm({ ...eventForm, minTeamSize: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required={eventForm.allowTeams}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Team Size *</label>
                      <input
                        type="number"
                        min="2"
                        value={eventForm.maxTeamSize}
                        onChange={(e) => setEventForm({ ...eventForm, maxTeamSize: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required={eventForm.allowTeams}
                      />
                    </div>
                    <div className="col-span-full">
                      <p className="text-xs text-purple-700">
                        ℹ️ Team leaders will create teams and invite {eventForm.minTeamSize && eventForm.maxTeamSize ? 
                        `${parseInt(eventForm.minTeamSize) - 1} to ${parseInt(eventForm.maxTeamSize) - 1}` : 
                        'members'}. Registration completes automatically when all members join.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Conditional: NORMAL Event - Custom Form Builder */}
              {eventForm.type === 'NORMAL' && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Custom Registration Form</h3>
                  <p className="text-sm text-gray-600 mb-4">Build a custom form for participants to fill during registration</p>
                  
                  {eventForm.formSchema.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {eventForm.formSchema.map((field, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{field.label}</p>
                            <p className="text-xs text-gray-500">
                              {field.type} {field.required && '(Required)'}
                              {field.type === 'select' && field.options?.length > 0 && (
                                <span className="ml-2">Options: {field.options.join(', ')}</span>
                              )}
                            </p>
                          </div>
                          <Button 
                            onClick={() => {
                              const newSchema = eventForm.formSchema.filter((_, i) => i !== index);
                              setEventForm({ ...eventForm, formSchema: newSchema });
                            }}
                            size="sm"
                            variant="danger"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Field Label"
                        id="fieldLabel"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <select
                        id="fieldType"
                        onChange={(e) => {
                          const optionsRow = document.getElementById('fieldOptionsRow');
                          if (optionsRow) {
                            optionsRow.style.display = e.target.value === 'select' ? 'block' : 'none';
                          }
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="select">Select (Dropdown)</option>
                        <option value="checkbox">Checkbox</option>
                      </select>
                      <label className="flex items-center px-3 py-2 border border-gray-300 rounded-lg">
                        <input type="checkbox" id="fieldRequired" className="mr-2" />
                        <span className="text-sm">Required</span>
                      </label>
                    </div>
                    
                    {/* Options row for select fields */}
                    <div id="fieldOptionsRow" style={{display: 'none'}}>
                      <input
                        type="text"
                        placeholder="Options (comma-separated, e.g., Option 1, Option 2, Option 3)"
                        id="fieldOptions"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      const label = document.getElementById('fieldLabel').value;
                      const type = document.getElementById('fieldType').value;
                      const required = document.getElementById('fieldRequired').checked;
                      const optionsInput = document.getElementById('fieldOptions').value;
                      
                      if (!label) {
                        alert('Please enter a field label');
                        return;
                      }
                      
                      if (type === 'select' && !optionsInput.trim()) {
                        alert('Please enter options for the select field');
                        return;
                      }

                      const newField = {
                        fieldId: `field_${Date.now()}`,
                        label,
                        type,
                        required,
                        options: type === 'select' ? optionsInput.split(',').map(o => o.trim()).filter(o => o) : [],
                        order: eventForm.formSchema.length
                      };

                      setEventForm({ 
                        ...eventForm, 
                        formSchema: [...eventForm.formSchema, newField] 
                      });

                      document.getElementById('fieldLabel').value = '';
                      document.getElementById('fieldRequired').checked = false;
                      document.getElementById('fieldOptions').value = '';
                      document.getElementById('fieldType').value = 'text';
                      document.getElementById('fieldOptionsRow').style.display = 'none';
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Add Form Field
                  </Button>
                </div>
              )}

              {/* Conditional: MERCH Event - Merchandise Items */}
              {eventForm.type === 'MERCH' && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Merchandise Items</h3>
                  <p className="text-sm text-gray-600 mb-4">Add items with variants (size, color) and stock details</p>
                  
                  {eventForm.items.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {eventForm.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                              <p className="text-xs text-gray-500">Purchase Limit: {item.purchaseLimitPerUser || 'Unlimited'} per user</p>
                            </div>
                            <Button 
                              onClick={() => {
                                const newItems = eventForm.items.filter((_, i) => i !== itemIndex);
                                setEventForm({ ...eventForm, items: newItems });
                              }}
                              size="sm"
                              variant="danger"
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-gray-700">Variants:</p>
                            {item.variants.map((variant, varIndex) => (
                              <p key={varIndex} className="text-xs text-gray-600 ml-2">
                                • Size: {variant.size}, Color: {variant.color}, Stock: {variant.stock}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Item Name"
                        value={draftItem.name}
                        onChange={(e) => setDraftItem({ ...draftItem, name: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="SKU"
                        value={draftItem.sku}
                        onChange={(e) => setDraftItem({ ...draftItem, sku: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <input
                      type="number"
                      placeholder="Purchase Limit Per User (leave empty for unlimited)"
                      value={draftItem.purchaseLimitPerUser}
                      onChange={(e) => setDraftItem({ ...draftItem, purchaseLimitPerUser: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />

                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-2">Add Variants:</p>
                      {draftItem.variants.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {draftItem.variants.map((variant, idx) => (
                            <div key={idx} className="text-xs bg-white p-2 rounded flex justify-between items-center border">
                              <span>Size: {variant.size}, Color: {variant.color}, Stock: {variant.stock}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setDraftItem({
                                    ...draftItem,
                                    variants: draftItem.variants.filter((_, i) => i !== idx)
                                  });
                                }}
                                className="text-red-600 hover:text-red-800 text-xs font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="grid grid-cols-4 gap-2">
                        <input
                          type="text"
                          placeholder="Size"
                          value={draftVariant.size}
                          onChange={(e) => setDraftVariant({ ...draftVariant, size: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Color"
                          value={draftVariant.color}
                          onChange={(e) => setDraftVariant({ ...draftVariant, color: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Stock"
                          value={draftVariant.stock}
                          onChange={(e) => setDraftVariant({ ...draftVariant, stock: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (!draftVariant.size || !draftVariant.color || !draftVariant.stock) {
                              alert('Please fill all variant fields');
                              return;
                            }

                            setDraftItem({
                              ...draftItem,
                              variants: [...draftItem.variants, {
                                size: draftVariant.size,
                                color: draftVariant.color,
                                stock: parseInt(draftVariant.stock, 10)
                              }]
                            });

                            setDraftVariant({ size: "", color: "", stock: "" });
                          }}
                          size="sm"
                          variant="secondary"
                        >
                          Add Variant
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        if (!draftItem.name || !draftItem.sku) {
                          alert('Item Name and SKU are required to add a new item.');
                          return;
                        }

                        if (draftItem.variants.length === 0) {
                          alert('Please add at least one variant');
                          return;
                        }

                        const newItem = {
                          name: draftItem.name,
                          sku: draftItem.sku,
                          purchaseLimitPerUser: draftItem.purchaseLimitPerUser ? parseInt(draftItem.purchaseLimitPerUser, 10) : null,
                          variants: draftItem.variants
                        };

                        setEventForm({ 
                          ...eventForm, 
                          items: [...eventForm.items, newItem] 
                        });

                        setDraftItem({
                          name: "",
                          sku: "",
                          purchaseLimitPerUser: "",
                          variants: []
                        });
                      }}
                      variant="info"
                      size="sm"
                      className="w-full"
                    >
                      Add Item
                    </Button>
                  </div>
                </div>
              )}

              <Button type="submit" variant="purple" className="w-full">Create Event</Button>
            </form>
          </Card>
        )}
 {/* REGISTRATIONS */}
        {activeTab === 'registrations' && (
          <Card title="Event Registrations">
            {/* Event Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Event:</label>
              <select
                value={selectedEvent?._id || ''}
                onChange={(e) => {
                  const event = myEvents.find(ev => ev._id === e.target.value);
                  if (event) {
                    setSelectedEvent(event);
                    fetchEventRegistrations(event._id);
                  }
                }}
                className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">-- Select an event --</option>
                {myEvents.map(event => (
                  <option key={event._id} value={event._id}>
                    {event.title} ({event.status})
                  </option>
                ))}
              </select>
            </div>

            {!selectedEvent ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Please select an event to view registrations</p>
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No registrations yet</p>
              </div>
            ) : (
              <>
                {/* Export and Search Controls */}
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-600">
                    Total: {registrations.length} registrations
                  </p>
                  <Button
                    onClick={async () => {
                      try {
                        const { exportRegistrations } = await import('../../api/organizerService');
                        const blob = await exportRegistrations(selectedEvent._id);
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${selectedEvent.title.replace(/\s+/g, '_')}_registrations.csv`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } catch (error) {
                        alert('Failed to export registrations');
                        console.error(error);
                      }
                    }}
                    variant="success"
                    size="sm"
                  >
                    Export CSV
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance Status</th>
                      {selectedEvent?.formSchema?.map((field) => (
                        <th key={field.fieldId} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {field.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {registrations.map((reg) => (
                      <tr key={reg._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {reg.participantId?.participantProfile?.firstname} {reg.participantId?.participantProfile?.lastname}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reg.participantId?.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{reg.ticketId}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            reg.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {reg.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(reg.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            reg.attended ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {reg.attended ? 'Attended' : 'Not Attended'}
                          </span>
                        </td>
                        {/* ======================= FINAL FIX APPLIED HERE ======================= */}
                        {selectedEvent?.formSchema?.map((field) => {
                          const safeResponse = reg.formResponse || {};
                          const nestedData = Object.values(safeResponse).find(
                            (val) => typeof val === "object" && val !== null
                          ) || safeResponse;
                          
                          const fieldValue = nestedData[field.fieldId];

                          return (
                            <td key={field.fieldId} className="px-6 py-4 text-sm text-gray-700">
                              {fieldValue != null && fieldValue !== ""
                                ? String(fieldValue)
                                : <span className="text-gray-400">N/A</span>
                              }
                            </td>
                          );
                        })}
                        {/* ====================================================================== */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </Card>
        )}
 {/* ANALYTICS */}
        {activeTab === 'analytics' && (
          <Card title="Event Analytics">
            {/* Event Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Event:</label>
              <select
                value={selectedEvent?._id || ''}
                onChange={(e) => {
                  const event = myEvents.find(ev => ev._id === e.target.value);
                  if (event) {
                    setSelectedEvent(event);
                    fetchEventAnalytics(event._id);
                  }
                }}
                className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">-- Select an event --</option>
                {myEvents.map(event => (
                  <option key={event._id} value={event._id}>
                    {event.title} ({event.status})
                  </option>
                ))}
              </select>
            </div>

            {!selectedEvent ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Please select an event to view analytics</p>
              </div>
            ) : !analytics ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Loading analytics...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <p className="text-sm font-medium text-blue-600 mb-1">Total Registrations</p>
                  <p className="text-3xl font-bold text-blue-900">{analytics.analytics?.totalRegistrations || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-6">
                  <p className="text-sm font-medium text-green-600 mb-1">Confirmed Registrations</p>
                  <p className="text-3xl font-bold text-green-900">{analytics.analytics?.confirmedRegistrations || 0}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-6">
                  <p className="text-sm font-medium text-red-600 mb-1">Cancelled Registrations</p>
                  <p className="text-3xl font-bold text-red-900">{analytics.analytics?.cancelledRegistrations || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-6">
                  <p className="text-sm font-medium text-purple-600 mb-1">Attended</p>
                  <p className="text-3xl font-bold text-purple-900">{analytics.analytics?.attended || 0}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-6">
                  <p className="text-sm font-medium text-yellow-600 mb-1">Attendance Rate</p>
                  <p className="text-3xl font-bold text-yellow-900">{analytics.analytics?.attendanceRate || '0%'}</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-6">
                  <p className="text-sm font-medium text-indigo-600 mb-1">Revenue</p>
                  <p className="text-3xl font-bold text-indigo-900">₹{analytics.analytics?.revenue || 0}</p>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* PAYMENT APPROVALS */}
        {activeTab === 'payments' && (
          <Card title="Payment Approvals">
            {!selectedPaymentEvent ? (
              <div>
                <p className="text-gray-700 mb-4">Select an event to view payment approvals:</p>
                <div className="space-y-2">
                  {myEvents.filter(e => e.type === 'MERCH' || (e.fee && e.fee > 0)).length === 0 ? (
                    <p className="text-gray-500">No paid events found</p>
                  ) : (
                    myEvents.filter(e => e.type === 'MERCH' || (e.fee && e.fee > 0)).map(event => (
                      <button
                        key={event._id}
                        onClick={() => {
                          setSelectedPaymentEvent(event._id);
                          fetchPaymentApprovals(event._id, paymentFilter);
                        }}
                        className="w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-900">{event.title}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(event.eventStartDate).toLocaleDateString()}
                              {' · '}
                              {event.type === 'MERCH' ? 'Merchandise' : `Registration Fee: ₹${event.fee}`}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                            event.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {event.status}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6 flex justify-between items-center">
                  <Button onClick={() => setSelectedPaymentEvent(null)} variant="secondary" size="sm">
                    ← Back to Events
                  </Button>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setPaymentFilter('PENDING');
                        fetchPaymentApprovals(selectedPaymentEvent, 'PENDING');
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        paymentFilter === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => {
                        setPaymentFilter('APPROVED');
                        fetchPaymentApprovals(selectedPaymentEvent, 'APPROVED');
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        paymentFilter === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Approved
                    </button>
                    <button
                      onClick={() => {
                        setPaymentFilter('REJECTED');
                        fetchPaymentApprovals(selectedPaymentEvent, 'REJECTED');
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        paymentFilter === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Rejected
                    </button>
                  </div>
                </div>

                {paymentApprovals.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No {paymentFilter.toLowerCase()} payments found</p>
                ) : (
                  <div className="space-y-4">
                    {paymentApprovals.map(reg => (
                      <div key={reg._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-1">
                            <h3 className="font-semibold text-gray-900 mb-2">Participant Details</h3>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Name:</span> {reg.participantId?.participantProfile?.firstname && reg.participantId?.participantProfile?.lastname ? `${reg.participantId.participantProfile.firstname} ${reg.participantId.participantProfile.lastname}` : 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Email:</span> {reg.participantId?.email || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Phone:</span> {reg.participantId?.participantProfile?.contactNumber || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Order Date:</span> {new Date(reg.createdAt).toLocaleString()}
                            </p>
                          </div>

                          <div className="md:col-span-1">
                            <h3 className="font-semibold text-gray-900 mb-2">{reg.order?.sku === 'REGISTRATION_FEE' ? 'Payment Details' : 'Order Details'}</h3>
                            {reg.order?.sku === 'REGISTRATION_FEE' ? (
                              <>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Type:</span> Registration Fee
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Amount:</span> ₹{reg.order?.amountPaid || reg.order?.price || 0}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Item:</span> {reg.order?.name || 'N/A'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">SKU:</span> {reg.order?.sku || 'N/A'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Variant:</span> {reg.order?.variant?.size || 'N/A'} / {reg.order?.variant?.color || 'N/A'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Quantity:</span> {reg.order?.quantity || 0}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Price:</span> ₹{reg.order?.price || 0}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Total:</span> ₹{(reg.order?.price || 0) * (reg.order?.quantity || 0)}
                                </p>
                              </>
                            )}
                          </div>

                          <div className="md:col-span-1">
                            <h3 className="font-semibold text-gray-900 mb-2">Payment Proof</h3>
                            {reg.order?.paymentProof ? (
                              <div>
                                <img
                                  src={`${import.meta.env.VITE_BACKEND_URL}${reg.order.paymentProof}`}
                                  alt="Payment proof"
                                  className="w-full h-48 object-contain border border-gray-300 rounded cursor-pointer"
                                  onClick={() => setSelectedPaymentProof(`${import.meta.env.VITE_BACKEND_URL}${reg.order.paymentProof}`)}
                                />
                                <p className="text-xs text-gray-500 mt-1">Click to enlarge</p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No payment proof uploaded yet</p>
                            )}
                            {reg.order?.paymentStatus === 'REJECTED' && reg.order?.rejectionReason && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                <p className="text-xs font-medium text-red-800">Rejection Reason:</p>
                                <p className="text-xs text-red-600 mt-1">{reg.order.rejectionReason}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {paymentFilter === 'PENDING' && reg.order?.paymentProof && (
                          <div className="mt-4 flex justify-end space-x-3">
                            <Button onClick={() => handleRejectPayment(reg._id)} variant="danger" size="sm">
                              Reject Payment
                            </Button>
                            <Button onClick={() => handleApprovePayment(reg._id)} variant="success" size="sm">
                              Approve Payment
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Payment Proof Modal */}
        {selectedPaymentProof && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={() => setSelectedPaymentProof(null)}
          >
            <div className="max-w-4xl max-h-screen p-4">
              <img
                src={selectedPaymentProof}
                alt="Payment proof enlarged"
                className="max-w-full max-h-full object-contain"
              />
              <p className="text-white text-center mt-4">Click anywhere to close</p>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <Card title="Organizer Profile">
            {!profileData ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Loading profile...</p>
                <Button onClick={fetchProfile} variant="purple">Load Profile</Button>
              </div>
            ) : !isEditingProfile ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Login Email (Non-editable)</p>
                    <p className="mt-1 text-lg text-gray-900">{profileData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Role</p>
                    <p className="mt-1">
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold capitalize">
                        {profileData.role}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Organization Name</p>
                      <p className="mt-1 text-lg text-gray-900">{profileData.organizerProfile?.name || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Category</p>
                      <p className="mt-1 text-lg text-gray-900">{profileData.organizerProfile?.category || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Description</p>
                      <p className="mt-1 text-gray-900">{profileData.organizerProfile?.description || 'Not set'}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Contact Email</p>
                        <p className="mt-1 text-gray-900">{profileData.organizerProfile?.contactEmail || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Contact Number</p>
                        <p className="mt-1 text-gray-900">{profileData.organizerProfile?.contactNumber || 'Not set'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Discord Webhook URL</p>
                      <p className="mt-1 text-gray-900 break-all">{profileData.organizerProfile?.discordWebhook || 'Not set'}</p>
                      <p className="text-xs text-gray-500 mt-1">Events will be automatically posted to Discord when published</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={() => setIsEditingProfile(true)} variant="purple">
                    Edit Profile
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Login Email (Non-editable)</p>
                    <p className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700">{profileData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Role</p>
                    <p className="px-4 py-2 bg-gray-100 rounded-lg">
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold capitalize">
                        {profileData.role}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
                      <input
                        type="text"
                        value={profileData.organizerProfile?.name || ''}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          organizerProfile: { ...profileData.organizerProfile, name: e.target.value }
                        })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <input
                        type="text"
                        value={profileData.organizerProfile?.category || ''}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          organizerProfile: { ...profileData.organizerProfile, category: e.target.value }
                        })}
                        required
                        placeholder="e.g., Sports Club, Tech Club, Cultural Club"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={profileData.organizerProfile?.description || ''}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          organizerProfile: { ...profileData.organizerProfile, description: e.target.value }
                        })}
                        rows="4"
                        placeholder="Tell us about your organization..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                        <input
                          type="email"
                          value={profileData.organizerProfile?.contactEmail || ''}
                          onChange={(e) => setProfileData({
                            ...profileData,
                            organizerProfile: { ...profileData.organizerProfile, contactEmail: e.target.value }
                          })}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                        <input
                          type="tel"
                          value={profileData.organizerProfile?.contactNumber || ''}
                          onChange={(e) => setProfileData({
                            ...profileData,
                            organizerProfile: { ...profileData.organizerProfile, contactNumber: e.target.value }
                          })}
                          placeholder="+1234567890"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discord Webhook URL</label>
                      <input
                        type="url"
                        value={profileData.organizerProfile?.discordWebhook || ''}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          organizerProfile: { ...profileData.organizerProfile, discordWebhook: e.target.value }
                        })}
                        placeholder="https://discord.com/api/webhooks/..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        When you publish an event, it will be automatically posted to this Discord channel
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" variant="success">
                    Save Changes
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => {
                      setIsEditingProfile(false);
                      fetchProfile(); // Reset to original data
                    }} 
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </Card>
        )}
      </main>

      {/* Feedback Viewer Modal */}
      {showFeedbackViewer && (
        <FeedbackViewer
          eventId={showFeedbackViewer._id}
          eventTitle={showFeedbackViewer.title}
          onClose={() => setShowFeedbackViewer(null)}
        />
      )}
    </div>
  );
}

export default OrganizerDashboard;