import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { useAuth } from './auth'
import { useToast } from './toast'
import type { ProgressMap, Status, TopicDetail } from './types'

export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: api.topics,
    staleTime: 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  })
}

export function useProgress() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['progress', user?.id],
    queryFn: api.progress,
    enabled: !!user,
    staleTime: 30 * 1000,
  })
}

export function useTopic(id: string) {
  return useQuery({ queryKey: ['topic', id], queryFn: () => api.topic(id) })
}

export function useSetStatus(topicId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const toast = useToast()
  const progressKey = ['progress', user?.id]
  const topicKey = ['topic', topicId]

  return useMutation({
    mutationFn: (status: Status) => api.setStatus(topicId, status),
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: progressKey })
      const prevProgress = queryClient.getQueryData<ProgressMap>(progressKey)
      const prevTopic = queryClient.getQueryData<TopicDetail>(topicKey)
      queryClient.setQueryData<ProgressMap>(progressKey, (p) => ({
        ...(p ?? {}),
        [topicId]: status,
      }))
      queryClient.setQueryData<TopicDetail>(topicKey, (t) => (t ? { ...t, status } : t))
      return { prevProgress, prevTopic }
    },
    onError: (_err, _status, ctx) => {
      queryClient.setQueryData(progressKey, ctx?.prevProgress)
      queryClient.setQueryData(topicKey, ctx?.prevTopic)
      toast("Couldn't save the status. Please try again.", 'error')
    },
  })
}

export function useOpenTopic() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: (topicId: string) => api.openTopic(topicId),
    onSuccess: ({ status }, topicId) => {
      queryClient.setQueryData<ProgressMap>(['progress', user?.id], (p) =>
        p ? { ...p, [topicId]: p[topicId] ?? status } : p,
      )
      queryClient.setQueryData<TopicDetail>(['topic', topicId], (t) =>
        t ? { ...t, status: t.status ?? status } : t,
      )
    },
  })
}
