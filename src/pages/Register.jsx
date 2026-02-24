import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstname: '',
        lastname: '',
        participantType: 'IIIT',
        college: 'IIIT Hyderabad',
        interests: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // If participant type changes to IIIT, lock college to IIIT Hyderabad
        if (name === 'participantType') {
            if (value === 'IIIT') {
                setFormData({...formData, participantType: value, college: 'IIIT Hyderabad'});
            } else {
                setFormData({...formData, participantType: value, college: ''});
            }
            return;
        }
        
        setFormData({...formData, [name]: value});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();  // prevent default form submission behavior (page reload)
        setError(''); // 
        setSuccess('');
        setLoading(true);

        try {
            // Convert interests string to array
            const interests = formData.interests
                ? formData.interests.split(',').map(i => i.trim()).filter(i => i)
                : [];

            const userData = {...formData,interests};

            await register(userData);

          //  console.log(userData)
            setSuccess('Registration successful! Please login.');
            
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
                <div>
                    <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h1>
                    <p className="mt-2 text-center text-sm text-gray-600">Join us as a participant</p>
                </div>

                {error && (<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>)}
                {success && (<div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>)}

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">First Name *</label>
                            <input type="text" id="firstname" name="firstname" value={formData.firstname}
                                onChange={handleChange} required placeholder="Enter first name"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
                        </div>

                        <div>
                            <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">Last Name *</label>
                            <input type="text" id="lastname" name="lastname" value={formData.lastname}
                                onChange={handleChange} required placeholder="Enter last name"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
                        <input type="email" id="email" name="email" value={formData.email}
                            onChange={handleChange} required placeholder="Enter your email"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
                        <p className="mt-1 text-xs text-gray-500">IIIT participants must use @students.iiit.ac.in or @research.iiit.ac.in</p>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password *</label>
                        <input type="password" id="password" name="password" value={formData.password}
                            onChange={handleChange} required minLength="6" placeholder="Enter password (min 6 characters)"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="participantType" className="block text-sm font-medium text-gray-700">Participant Type *</label>
                            <select id="participantType" name="participantType" value={formData.participantType}
                                onChange={handleChange} required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                <option value="IIIT">IIIT</option>
                                <option value="NON_IIIT">Non-IIIT</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="college" className="block text-sm font-medium text-gray-700">College/Organization *</label>
                            <input type="text" id="college" name="college" value={formData.college}
                                onChange={handleChange} required placeholder="Enter college/organization"
                                disabled={formData.participantType === 'IIIT'}
                                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${formData.participantType === 'IIIT' ? 'bg-gray-100 cursor-not-allowed' : ''}`}/>
                            {formData.participantType === 'IIIT' && (
                                <p className="mt-1 text-xs text-gray-500">College is locked for IIIT participants</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="interests" className="block text-sm font-medium text-gray-700">Interests (comma-separated)</label>
                        <input type="text" id="interests" name="interests" value={formData.interests}
                        onChange={handleChange} placeholder="e.g., Sports, Music, Tech"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
                    </div>

                    <Button type="submit" disabled={loading} variant="purple" className="w-full" size="lg">
                        {loading ? 'Registering...' : 'Register'}
                    </Button>
                </form>

                <div className="text-center">
                    <p className="text-sm text-gray-600">Already have an account?{' '}
                        <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
