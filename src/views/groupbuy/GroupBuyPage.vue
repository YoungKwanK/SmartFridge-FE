<template>
  <PageLayout
    title="공동구매"
    description="같이 사면 더 싼 식재료를 멤버와 나눠 사요. 글을 올리면 참여자 채팅방이 함께 열려요."
    width="narrow"
  >
    <PostBoard :category="PURCHASE_CATEGORY" />
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/components/layout/PageLayout.vue';
import PostBoard from '@/components/community/PostBoard.vue';
import { PURCHASE_CATEGORY } from '@/utils/postCategory';
</script>
