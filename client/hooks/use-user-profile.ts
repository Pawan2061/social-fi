import { useQuery } from '@tanstack/react-query'
import { UserProfile } from '@/types/profile/profile-types'


const API_URL = 'http://localhost:4000/api/users/me'

export function useUserProfile() {
    return useQuery<UserProfile>({
        queryKey: ['userProfile'],
        queryFn: async () => {
            const token = localStorage.getItem('authToken')

            if (!token) {
                throw new Error('No authentication token found')
            }

            const res = await fetch(API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            if (!res.ok) {
                throw new Error(`Failed to fetch user profile: ${res.statusText}`)
            }

            return res.json()
        },
        staleTime: 1000 * 60 * 5, // 5 minutes cache
        retry: 1, // retry once on failure
    })
}
