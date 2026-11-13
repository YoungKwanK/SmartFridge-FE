<template>
  <!--
    사이드바 안쪽 화면의 공통 틀.
      width   : narrow(글·목록) | default(패널 2단) | wide(표·대시보드)
      title·description 또는 #description : 기본 머리말
      #actions : 머리말 오른쪽 버튼
      #head    : 머리말 전체를 직접 그릴 때 (예: 글 상세의 '목록으로' 줄)
      기본 슬롯 : 본문. 바로 아래 블록끼리는 --sf-section-gap 간격으로 쌓인다
  -->
  <div class="sf-page" :class="`sf-page--${width}`">
    <slot name="head">
      <header v-if="title" class="sf-page-head">
        <div class="sf-page-head-text">
          <h1 class="sf-page-title">{{ title }}</h1>
          <p v-if="description || $slots.description" class="sf-page-desc">
            <slot name="description">{{ description }}</slot>
          </p>
        </div>
        <div v-if="$slots.actions" class="sf-page-actions">
          <slot name="actions" />
        </div>
      </header>
    </slot>

    <div class="sf-page-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  width: {
    type: String,
    default: 'default',
    validator: (value) => ['narrow', 'default', 'wide'].includes(value)
  }
});
</script>
