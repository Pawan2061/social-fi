import { useQuery } from '@tanstack/react-query'
import { FeedResponse } from '@/types/feed/feed-types'


const API_URL = 'http://localhost:4000/api/posts/'

export function useFeed() {
    return useQuery<FeedResponse>({
        queryKey: ['feed'],
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
                throw new Error(`Failed to fetch feed: ${res.statusText}`)
            }

            return res.json()
        },
        staleTime: 1000 * 60, // 1 min cache
        retry: 1, // retry once on failure
    })
}
