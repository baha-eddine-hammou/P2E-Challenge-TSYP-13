// Password Reset Page
import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const { resetPassword } = useAuth();

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        try {
            setMessage('');
            setError('');
            setLoading(true);
            await resetPassword(email);
            setMessage('Check your inbox for password reset instructions');
        } catch (err: any) {
            setError('Failed to reset password. Please check your email address.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="font-display text-4xl font-bold mb-2">
                        Reset <span className="hydro-gradient-text">Password</span>
                    </h1>
                    <p className="text-muted-foreground">Enter your email to receive reset instructions</p>
                </div>

                {/* Reset Form */}
                <div className="hydro-card p-8">
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

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : 'Reset Password'}
                        </button>
                    </form>

                    {/* Back to Sign In */}
                    <div className="text-center mt-6 space-y-2">
                        <Link to="/signin" className="text-sm text-primary hover:underline font-medium block">
                            ← Back to Sign In
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-primary hover:underline font-medium">
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
