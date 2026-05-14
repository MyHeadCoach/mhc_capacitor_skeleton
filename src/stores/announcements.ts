import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export interface FeedPost {
  id: string;
  content: string;
  html_content?: string;
  author?: { id: string; name: string; avatar_url?: string; role: string };
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_pinned: boolean;
  attachments: any[];
}

export const useAnnouncementsStore = defineStore('announcements', () => {
  const posts = ref<FeedPost[]>([]);
  const loading = ref(false);
  const communityName = ref('');

  async function fetchAnnouncements() {
    loading.value = true;
    try {
      // Fetch user's communities, then get feed from first community
      const { data: commData } = await api.get('/api/m/my-communities');
      const communities = commData.communities?.data ?? commData.data ?? [];
      if (communities.length === 0) {
        posts.value = [];
        return;
      }

      const community = communities[0];
      communityName.value = community.name;

      const { data: feedData } = await api.get(`/api/m/communities/${community.id}/feed`, {
        params: { per_page: 20 },
      });
      posts.value = feedData.posts?.data ?? feedData.data ?? [];
    } catch {
      // No data available
    } finally {
      loading.value = false;
    }
  }

  return { posts, loading, communityName, fetchAnnouncements };
});
