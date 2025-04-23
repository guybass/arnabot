import { User } from '@/api/entities';
import { useState, useEffect } from 'react';

const usePermissions = () => {
    const [userPermissions, setUserPermissions] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUserPermissions();
    }, []);

    const loadUserPermissions = async () => {
        try {
            const currentUser = await User.me();
            setUserPermissions(currentUser.permissions || []);
            setIsAdmin(currentUser.role === 'admin');
        } catch (error) {
            console.error('Error loading user permissions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const hasPermission = (permission) => {
        if (isAdmin) return true;
        return userPermissions?.includes(permission) || false;
    };

    return { hasPermission, isAdmin, isLoading };
};

export default usePermissions;