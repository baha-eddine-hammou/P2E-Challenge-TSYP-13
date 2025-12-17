// Admin Panel - User Management
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Users, Mail, Calendar, Shield, Trash2, ArrowLeft, Search, CheckCircle, XCircle } from 'lucide-react';

interface UserData {
    uid: string;
    email: string;
    displayName: string;
    createdAt: any;
    lastLogin: any;
    emailVerified: boolean;
    role: string;
}

export default function AdminPanel() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUserRole, setCurrentUserRole] = useState('user');

    useEffect(() => {
        loadUsers();
        loadCurrentUserRole();
    }, []);

    async function loadCurrentUserRole() {
        if (currentUser) {
            try {
                const userDoc = await getDocs(query(collection(db, 'users')));
                const userData = userDoc.docs.find(doc => doc.id === currentUser.uid)?.data();
                setCurrentUserRole(userData?.role || 'user');
            } catch (error) {
                console.error('Error loading user role:', error);
            }
        }
    }

    async function loadUsers() {
        try {
            setLoading(true);
            const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(usersQuery);

            const usersData: UserData[] = [];
            querySnapshot.forEach((doc) => {
                usersData.push({
                    uid: doc.id,
                    ...doc.data() as Omit<UserData, 'uid'>
                });
            });

            setUsers(usersData);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    }

    async function toggleUserRole(userId: string, currentRole: string) {
        try {
            const newRole = currentRole === 'admin' ? 'user' : 'admin';
            await updateDoc(doc(db, 'users', userId), {
                role: newRole
            });
            loadUsers(); // Reload users
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('Failed to update user role');
        }
    }

    async function deleteUser(userId: string, email: string) {
        if (!confirm(`Are you sure you want to delete user: ${email}?\n\nNote: This only removes from database. To fully delete the user, use Firebase Console.`)) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'users', userId));
            loadUsers(); // Reload users
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        }
    }

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        try {
            return new Date(timestamp.seconds * 1000).toLocaleDateString() + ' ' +
                new Date(timestamp.seconds * 1000).toLocaleTimeString();
        } catch {
            return 'N/A';
        }
    };

    // Check if current user is admin
    if (currentUserRole !== 'admin') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center px-4">
                <div className="hydro-card p-8 max-w-md text-center">
                    <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
                    <h1 className="font-display text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-muted-foreground mb-2">
                        You don't have permission to access the admin panel.
                    </p>
                    <div className="mb-6 p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Debug Info:</p>
                        <p className="text-sm">Current Role: <strong>{currentUserRole || 'none'}</strong></p>
                        <p className="text-sm">User ID: <strong>{currentUser?.uid}</strong></p>
                    </div>
                    <Link
                        to="/dashboard"
                        className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-colors"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-display text-4xl font-bold flex items-center gap-3">
                                <Shield className="w-10 h-10 text-primary" />
                                Admin <span className="hydro-gradient-text">Panel</span>
                            </h1>
                            <p className="text-muted-foreground mt-2">Manage user accounts and permissions</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total Users</p>
                            <p className="text-3xl font-bold text-primary">{users.length}</p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="hydro-card p-6 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by email or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="hydro-card overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                            <p className="mt-4 text-muted-foreground">Loading users...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No users found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="text-left p-4 font-semibold">User</th>
                                        <th className="text-left p-4 font-semibold">Email</th>
                                        <th className="text-left p-4 font-semibold">Verified</th>
                                        <th className="text-left p-4 font-semibold">Role</th>
                                        <th className="text-left p-4 font-semibold">Created</th>
                                        <th className="text-left p-4 font-semibold">Last Login</th>
                                        <th className="text-left p-4 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.uid} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-hero-gradient flex items-center justify-center">
                                                        <span className="text-sm font-semibold text-primary-foreground">
                                                            {user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{user.displayName || 'No name'}</p>
                                                        {user.uid === currentUser?.uid && (
                                                            <span className="text-xs text-primary">(You)</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm">{user.email}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {user.emailVerified ? (
                                                        <>
                                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                                            <span className="text-sm text-green-600">Yes</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="w-4 h-4 text-orange-500" />
                                                            <span className="text-sm text-orange-600">No</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => toggleUserRole(user.uid, user.role)}
                                                    disabled={user.uid === currentUser?.uid}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${user.role === 'admin'
                                                        ? 'bg-amber-500/20 text-amber-700 hover:bg-amber-500/30'
                                                        : 'bg-primary/20 text-primary hover:bg-primary/30'
                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                >
                                                    {user.role || 'user'}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatDate(user.createdAt)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDate(user.lastLogin)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => deleteUser(user.uid, user.email)}
                                                    disabled={user.uid === currentUser?.uid}
                                                    className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Delete user from database"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Info Note */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> Deleting a user from this panel only removes their data from Firestore.
                        To completely delete the user account, use the Firebase Console Authentication section.
                    </p>
                </div>
            </div>
        </div>
    );
}
