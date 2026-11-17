<template>
  <PageLayout title="공지사항" description="냉장고 관리자가 올린 안내예요." width="narrow">
    <PostBoard :category="NOTICE_CATEGORY" />
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/components/layout/PageLayout.vue';
import PostBoard from '@/components/community/PostBoard.vue';
import { NOTICE_CATEGORY } from '@/utils/postCategory';
</script>
