// User Settings Page
import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function Settings() {
    const { currentUser, updateUserProfile, updateUserEmail, updateUserPassword, verifyEmail } = useAuth();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleProfileUpdate(e: FormEvent) {
        e.preventDefault();

        try {
            setError('');
            setMessage('');
            setLoading(true);
            await updateUserProfile(displayName);
            setMessage('Profile updated successfully!');
        } catch (err: any) {
            setError('Failed to update profile');
        } finally {
            setLoading(false);
        }
    }

    async function handleEmailUpdate(e: FormEvent) {
        e.preventDefault();

        try {
            setError('');
            setMessage('');
            setLoading(true);
            await updateUserEmail(email);
            setMessage('Email updated! Please verify your new email.');
        } catch (err: any) {
            setError('Failed to update email. You may need to sign in again.');
        } finally {
            setLoading(false);
        }
    }

    async function handlePasswordUpdate(e: FormEvent) {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        if (password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        try {
            setError('');
            setMessage('');
            setLoading(true);
            await updateUserPassword(password);
            setMessage('Password updated successfully!');
            setPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError('Failed to update password. You may need to sign in again.');
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyEmail() {
        try {
            setError('');
            setMessage('');
            setLoading(true);
            await verifyEmail();
            setMessage('Verification email sent! Check your inbox.');
        } catch (err: any) {
            setError('Failed to send verification email');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="font-display text-4xl font-bold">
                        Account <span className="hydro-gradient-text">Settings</span>
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage your account information and security</p>
                </div>

                {/* Messages */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {message && (
                    <div className="bg-primary/10 border border-primary/20 text-primary rounded-lg p-4 mb-6 flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{message}</p>
                    </div>
                )}

                {/* Email Verification Status */}
                {!currentUser?.emailVerified && (
                    <div className="hydro-card p-6 mb-6 border-l-4 border-l-amber-500">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-semibold mb-1">Email Not Verified</h3>
                                <p className="text-sm text-muted-foreground">
                                    Please verify your email address to access all features.
                                </p>
                            </div>
                            <button
                                onClick={handleVerifyEmail}
                                disabled={loading}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50"
                            >
                                Send Verification
                            </button>
                        </div>
                    </div>
                )}

                {/* Profile Settings */}
                <div className="hydro-card p-8 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <User className="w-6 h-6 text-primary" />
                        <h2 className="font-display text-xl font-semibold">Profile Information</h2>
                    </div>

                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium mb-2">
                                Display Name
                            </label>
                            <input
                                id="displayName"
                                type="text"
                                required
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Your name"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Update Profile
                        </button>
                    </form>
                </div>

                {/* Email Settings */}
                <div className="hydro-card p-8 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Mail className="w-6 h-6 text-primary" />
                        <h2 className="font-display text-xl font-semibold">Email Address</h2>
                    </div>

                    <form onSubmit={handleEmailUpdate} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="you@example.com"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Changing your email will require verification
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Update Email
                        </button>
                    </form>
                </div>

                {/* Password Settings */}
                <div className="hydro-card p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Lock className="w-6 h-6 text-primary" />
                        <h2 className="font-display text-xl font-semibold">Change Password</h2>
                    </div>

                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-2">
                                New Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="At least 6 characters"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                                Confirm New Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Confirm your password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Change Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
