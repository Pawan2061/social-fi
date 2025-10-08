import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FeedResponse, FeedItem } from '@/types/feed/feed-types'


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

export function useInvalidateFeed() {
    const queryClient = useQueryClient()

    return () => {
        queryClient.invalidateQueries({ queryKey: ['feed'] })
    }
}

export function useOptimisticFeedUpdate() {
    const queryClient = useQueryClient()

    return (newPost: FeedItem) => {
        queryClient.setQueryData(['feed'], (oldData: FeedResponse | undefined) => {
            if (!oldData) return oldData

            // Add the new post to the beginning of the feed
            return {
                ...oldData,
                items: [newPost, ...(oldData.items || [])]
            }
        })
    }
}
