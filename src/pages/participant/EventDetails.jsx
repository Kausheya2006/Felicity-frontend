import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById, registerForEvent, registerForMerchEvent } from '../../api/eventService';
import { createTeam } from '../../api/teamService';
import { getMyRegistrations } from '../../api/participantService';
import { initSocket, disconnectSocket } from '../../api/messageService';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import CreateTeamModal from '../../components/CreateTeamModal';
import JoinTeamModal from '../../components/JoinTeamModal';
import DiscussionForum from '../../components/DiscussionForum';
import FeedbackForm from '../../components/FeedbackForm';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showJoinTeamModal, setShowJoinTeamModal] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [canAccessForum, setCanAccessForum] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  // Check registration status and initialize socket
  useEffect(() => {
    const checkAccess = async () => {
      if (!event || !user) return;

      // Check if user is the organizer of this event
      const organizerMatch = user.role === 'organizer' && (
        event.organizerId?._id === user.id || 
        event.organizerId === user.id
      );
      setIsOrganizer(organizerMatch);

      if (organizerMatch) {
        setCanAccessForum(true);
        initSocket(localStorage.getItem('token'));
        return;
      }

      // Check if participant is registered
      if (user.role === 'participant') {
        try {
          const registrations = await getMyRegistrations();
          const registered = registrations.some(reg => 
            reg.eventId === id || reg.eventId?._id === id
          );
          setIsRegistered(registered);
          setCanAccessForum(registered);
          if (registered) {
            initSocket(localStorage.getItem('token'));
          }
        } catch (error) {
          console.error('Error checking registration:', error);
        }
      }
    };

    checkAccess();

    return () => {
      // Cleanup socket on unmount
      if (canAccessForum) {
        disconnectSocket();
      }
    };
  }, [event, user, id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const data = await getEventById(id);
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event details:', error);
      alert('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const isRegistrationClosed = () => {
    if (!event) return false;
    
    // If registration deadline is set, use it
    if (event.registrationDeadline) {
      return new Date() > new Date(event.registrationDeadline);
    }
    
    // If no deadline but event has started, registration is closed
    if (event.eventStartDate) {
      return new Date() > new Date(event.eventStartDate);
    }
    
    return false;
  };

  const getRegistrationDeadlineText = () => {
    if (!event) return 'N/A';
    
    if (event.registrationDeadline) {
      return new Date(event.registrationDeadline).toLocaleString();
    }
    
    if (event.eventStartDate) {
      return `Until event starts (${new Date(event.eventStartDate).toLocaleString()})`;
    }
    
    return 'No deadline set';
  };

  const isLimitReached = () => {
    if (!event || !event.maxParticipants) return false;
    return event.currentRegistrations >= event.maxParticipants;
  };

  const handleNormalRegistration = async (e) => {
    e.preventDefault();
    try {
      await registerForEvent(id, { formData });
      alert('Registration successful! Check your email for the ticket.');
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleMerchPurchase = async () => {
    if (!selectedItem || !selectedVariant) {
      alert('Please select an item and variant');
      return;
    }

    try {
      const orderData = {
        order: {
          sku: selectedItem.sku,
          name: selectedItem.name,
          variant: {
            size: selectedVariant.size,
            color: selectedVariant.color
          },
          quantity,
          price: event.fee || 0
        }
      };
      await registerForMerchEvent(id, orderData);
      alert('Purchase successful! Please upload payment proof in your dashboard.');
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Purchase failed');
    }
  };

  const handleMerchEventRegistration = async () => {
    try {
      await registerForEvent(id, { formData: {} });
      alert('Registration successful! You can purchase merchandise later if you want.');
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleCreateTeam = async (teamData) => {
    try {
      await createTeam({
        eventId: id,
        teamName: teamData.teamName,
        teamSize: teamData.teamSize,
        formResponse: formData
      });
      alert('Team created successfully! Share the invite code with your team members.');
      navigate('/teams');
    } catch (error) {
      throw error; // Let modal handle the error
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Event Details" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Event Details" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Event Details" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button onClick={() => navigate('/browse-events')} variant="secondary" size="sm" className="mb-4">
          ← Back to Browse
        </Button>

        <Card>
          {/* Event Header */}
          <div className="border-b pb-4 mb-4">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                event.type === 'MERCH' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {event.type}
              </span>
            </div>
            <p className="text-gray-600 mt-2">{event.description}</p>
          </div>

          {/* Event Details */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Organizer</p>
                <p className="text-lg text-gray-900">{event.organizerId?.organizerProfile?.name || 'N/A'}</p>
              </div>

              {event.eventStartDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Start Date</p>
                  <p className="text-lg text-gray-900">
                    {new Date(event.eventStartDate).toLocaleString()}
                  </p>
                </div>
              )}

              {event.eventEndDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">End Date</p>
                  <p className="text-lg text-gray-900">
                    {new Date(event.eventEndDate).toLocaleString()}
                  </p>
                </div>
              )}

              {event.venue && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Venue</p>
                  <p className="text-lg text-gray-900">{event.venue}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-500">Registration Deadline</p>
                <p className="text-lg text-gray-900">
                  {getRegistrationDeadlineText()}
                </p>
                {!event.registrationDeadline && event.eventStartDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Registrations close when event starts
                  </p>
                )}
              </div>

              {event.maxParticipants && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Registration Limit</p>
                  <p className="text-lg text-gray-900">{event.maxParticipants} participants</p>
                </div>
              )}

              {event.fee > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Fee</p>
                  <p className="text-lg font-semibold text-green-600">${event.fee}</p>
                </div>
              )}

              {event.eligibility && event.eligibility.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Eligibility</p>
                  <div className="flex gap-2 mt-1">
                    {event.eligibility.map((el, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded">
                        {el}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {event.allowTeams && (
                <div className="col-span-full">
                  <p className="text-sm font-medium text-gray-500">Team Registration</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                      Team Event
                    </span>
                    <span className="text-sm text-gray-600">
                      {event.minTeamSize} - {event.maxTeamSize} members per team
                    </span>
                  </div>
                </div>
              )}
            </div>

            {event.tags && event.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Blocking Messages */}
          {isRegistrationClosed() && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-medium">
                {event.registrationDeadline ? 'Registration deadline has passed' : 'Event has already started - registrations closed'}
              </p>
            </div>
          )}

          {isLimitReached() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 font-medium">Registration limit reached</p>
            </div>
          )}

          {/* Team Registration Section */}
          {event.allowTeams && !isRegistrationClosed() && !isLimitReached() && (
            <div className="border-t pt-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Team Registration</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-medium mb-2">This event requires team registration</p>
                <p className="text-sm text-green-700">
                  Create a team and invite {event.minTeamSize - 1} to {event.maxTeamSize - 1} members, 
                  or join an existing team using an invite code.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => setShowCreateTeamModal(true)}
                  variant="primary"
                  className="w-full"
                >
                  Create New Team
                </Button>
                <Button
                  onClick={() => setShowJoinTeamModal(true)}
                  variant="secondary"
                  className="w-full"
                >
                  Join Existing Team
                </Button>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/teams')}
                  className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                >
                  View My Teams →
                </button>
              </div>
            </div>
          )}

          {/* Registration Form for NORMAL Events */}
          {event.type === 'NORMAL' && !event.allowTeams && !isRegistrationClosed() && !isLimitReached() && (
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Register for Event</h2>
              <form onSubmit={handleNormalRegistration} className="space-y-4">
                {event.formSchema && event.formSchema.length > 0 ? (
                  event.formSchema.map((field) => (
                    <div key={field.fieldId}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'text' && (
                        <input
                          type="text"
                          required={field.required}
                          onChange={(e) => setFormData({ ...formData, [field.fieldId]: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      {field.type === 'number' && (
                        <input
                          type="number"
                          required={field.required}
                          onChange={(e) => setFormData({ ...formData, [field.fieldId]: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      {field.type === 'select' && field.options && (
                        <select
                          required={field.required}
                          onChange={(e) => setFormData({ ...formData, [field.fieldId]: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select...</option>
                          {field.options.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {field.type === 'checkbox' && (
                        <input
                          type="checkbox"
                          required={field.required}
                          onChange={(e) => setFormData({ ...formData, [field.fieldId]: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No additional information required</p>
                )}
                <Button type="submit" variant="primary" className="w-full">
                  Register Now
                </Button>
              </form>
            </div>
          )}

          {/* Purchase Form for MERCH Events */}
          {event.type === 'MERCH' && !isRegistrationClosed() && (
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Register & Purchase Merchandise</h2>
              
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You can register for this event without purchasing merchandise, 
                  or you can purchase merchandise now.
                </p>
              </div>

              <div className="mb-6">
                <Button
                  onClick={handleMerchEventRegistration}
                  variant="secondary"
                  className="w-full"
                >
                  Register Without Merchandise
                </Button>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Or Purchase Merchandise</h3>
              
              {event.items && event.items.length > 0 ? (
                <div className="space-y-4">
                  {/* Item Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Item (Optional)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {event.items.map((item) => (
                        <div
                          key={item.sku}
                          onClick={() => {
                            setSelectedItem(item);
                            setSelectedVariant(null);
                          }}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                            selectedItem?.sku === item.sku
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                          {item.purchaseLimitPerUser && (
                            <p className="text-xs text-gray-600 mt-1">
                              Limit: {item.purchaseLimitPerUser} per user
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Variant Selection */}
                  {selectedItem && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Variant</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedItem.variants.map((variant, idx) => (
                          <div
                            key={idx}
                            onClick={() => variant.stock > 0 && setSelectedVariant(variant)}
                            className={`p-3 border-2 rounded-lg cursor-pointer transition ${
                              variant.stock === 0
                                ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                                : selectedVariant === variant
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <p className="font-medium text-sm">Size: {variant.size}</p>
                            <p className="text-sm text-gray-600">Color: {variant.color}</p>
                            <p className={`text-xs mt-1 ${
                              variant.stock === 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {variant.stock === 0 ? 'Out of Stock' : `Stock: ${variant.stock}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  {selectedVariant && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        max={Math.min(
                          selectedVariant.stock,
                          selectedItem.purchaseLimitPerUser || selectedVariant.stock
                        )}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Purchase Button */}
                  <Button
                    onClick={handleMerchPurchase}
                    variant="primary"
                    className="w-full"
                    disabled={!selectedItem || !selectedVariant}
                  >
                    Register & Purchase {event.fee > 0 && `- $${event.fee * quantity}`}
                  </Button>
                </div>
              ) : (
                <p className="text-gray-500">No items available for purchase</p>
              )}
              </div>
            </div>
          )}
        </Card>

        {/* Feedback Section - Only for registered participants */}
        {isRegistered && user?.role === 'participant' && !isOrganizer && (
          <Card className="mt-6">
            <div className="p-6 text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Share Your Feedback</h3>
              <p className="text-gray-600 mb-4">
                Help us improve future events by sharing your experience! Your feedback is valuable to us.
              </p>
              <Button
                onClick={() => setShowFeedbackForm(true)}
                variant="primary"
                className="px-6 py-3"
              >
                Submit Feedback
              </Button>
            </div>
          </Card>
        )}

        {/* Discussion Forum - Only visible for registered participants or organizers */}
        {canAccessForum && (
          <div className="mt-8">
            <DiscussionForum eventId={id} isOrganizer={isOrganizer} />
          </div>
        )}

        {/* Forum Access Notice for non-registered users */}
        {!canAccessForum && user && event?.status === 'PUBLISHED' && (
          <div className="mt-8 bg-gray-100 rounded-lg p-6 text-center">
            <p className="text-gray-600">
              Register for this event to access the discussion forum and connect with other participants!
            </p>
          </div>
        )}
      </main>

      <CreateTeamModal
        isOpen={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
        onSubmit={handleCreateTeam}
        event={event}
      />

      <JoinTeamModal
        isOpen={showJoinTeamModal}
        onClose={() => setShowJoinTeamModal(false)}
        onSubmit={(code) => {
          navigate('/teams');
        }}
      />

      {showFeedbackForm && (
        <FeedbackForm
          eventId={id}
          eventTitle={event?.title}
          onClose={() => setShowFeedbackForm(false)}
          onSuccess={() => {
            alert('Thank you for your feedback!');
            setShowFeedbackForm(false);
          }}
        />
      )}
    </div>
  );
};

export default EventDetails;
