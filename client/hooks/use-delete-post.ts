import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deletePost as deletePostApi } from '@/lib/api'
import type { UserProfile } from '@/types/profile/profile-types'
import type { FeedResponse, FeedItem } from '@/types/feed/feed-types'

export function useDeletePost() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (postId: number | string) => {
            await deletePostApi(postId)
            return postId
        },
        onMutate: async (postId) => {
            // Cancel outgoing queries
            await Promise.all([
                queryClient.cancelQueries({ queryKey: ['userProfile'] }),
                queryClient.cancelQueries({ queryKey: ['feed'] }),
                queryClient.cancelQueries({ queryKey: ['feed', 'infinite'] }),
            ])

            // Snapshot previous values
            const prevProfile = queryClient.getQueryData<UserProfile>(['userProfile'])
            const prevFeed = queryClient.getQueryData<FeedResponse>(['feed'])
            const prevInfinite = queryClient.getQueryData<{ pages: FeedResponse[]; pageParams: unknown[] }>(['feed', 'infinite', 10])

            // Optimistically update profile posts
            if (prevProfile?.posts) {
                queryClient.setQueryData<UserProfile>(['userProfile'], {
                    ...prevProfile,
                    posts: prevProfile.posts.filter((p) => String(p.id) !== String(postId)),
                })
            }

            // Optimistically update simple feed
            if (prevFeed?.items) {
                queryClient.setQueryData<FeedResponse>(['feed'], {
                    ...prevFeed,
                    items: prevFeed.items.filter((i: FeedItem) => String(i.id) !== String(postId)),
                })
            }

            // Optimistically update infinite feed pages
            if (prevInfinite?.pages) {
                const newPages = prevInfinite.pages.map((page: FeedResponse) => ({
                    ...page,
                    items: (page.items || []).filter((i: FeedItem) => String(i.id) !== String(postId)),
                }))
                queryClient.setQueryData(['feed', 'infinite', 10], { ...prevInfinite, pages: newPages })
            }

            return { prevProfile, prevFeed, prevInfinite }
        },
        onError: (err, variables, context) => {
            // Rollback
            if (context?.prevProfile) queryClient.setQueryData(['userProfile'], context.prevProfile)
            if (context?.prevFeed) queryClient.setQueryData(['feed'], context.prevFeed)
            if (context?.prevInfinite) queryClient.setQueryData(['feed', 'infinite', 10], context.prevInfinite)
        },
        onSettled: () => {
            // Ensure final consistency
            queryClient.invalidateQueries({ queryKey: ['userProfile'] })
            queryClient.invalidateQueries({ queryKey: ['feed'] })
            queryClient.invalidateQueries({ queryKey: ['feed', 'infinite'] })
        },
    })
}
