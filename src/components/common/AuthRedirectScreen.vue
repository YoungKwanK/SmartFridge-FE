<template>
  <main class="auth-screen">
    <a href="/" class="brand" aria-label="SmartFridge 처음 화면">
      <img src="@/assets/images/SFlogo/smartFridge_logo.png" alt="" class="brand-logo" />
      <span>SmartFridge</span>
    </a>

    <section class="auth-panel" aria-live="polite">
      <v-progress-circular indeterminate color="primary" size="40" width="3" />
      <h1 class="auth-title">{{ provider }}로 로그인하는 중이에요</h1>
      <p class="auth-status">{{ statusMessage }}</p>

      <ol class="auth-steps">
        <li
          v-for="(label, index) in steps"
          :key="label"
          :class="{ 'is-done': currentStep > index + 1, 'is-now': currentStep === index + 1 }"
        >
          <span class="step-mark" aria-hidden="true">
            <v-icon v-if="currentStep > index + 1" size="14">mdi-check</v-icon>
          </span>
          {{ label }}
        </li>
      </ol>

      <div
        class="auth-bar"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="Math.round(progress)"
        aria-label="로그인 진행률"
      >
        <span :style="{ width: `${Math.min(100, progress)}%` }" />
      </div>
    </section>
  </main>
</template>

<script setup>
defineProps({
  provider: { type: String, required: true },
  currentStep: { type: Number, default: 1 },
  progress: { type: Number, default: 0 },
  statusMessage: { type: String, default: '' }
});

const steps = ['로그인 정보 확인', '계정 연결', '냉장고로 이동'];
</script>

<style scoped>
.auth-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  min-height: 100vh;
  padding: 24px 16px;
  background: var(--sf-bg);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--sf-fs-lg);
  font-weight: 800;
  color: var(--sf-text);
  text-decoration: none;
}

.brand-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.auth-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(400px, 100%);
  padding: 36px 32px 28px;
  border-radius: var(--sf-radius-lg);
  background: var(--sf-surface);
  box-shadow: var(--sf-shadow);
  text-align: center;
}

.auth-title {
  margin: 20px 0 0;
  font-size: var(--sf-fs-xl);
  font-weight: 800;
  color: var(--sf-text);
}

.auth-status {
  min-height: 1.5em;
  margin: 6px 0 0;
  font-size: var(--sf-fs-md);
  color: var(--sf-text-sub);
}

.auth-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin: 24px 0 20px;
  padding: 0;
  list-style: none;
  text-align: left;
}

.auth-steps li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--sf-fs-md);
  color: var(--sf-text-faint);
}

.auth-steps li.is-now {
  font-weight: 600;
  color: var(--sf-text);
}

.auth-steps li.is-done {
  color: var(--sf-text-sub);
}

.step-mark {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border: 2px solid var(--sf-line-strong);
  border-radius: 50%;
  color: #fff;
}

.is-now .step-mark {
  border-color: var(--sf-primary);
}

.is-done .step-mark {
  border-color: var(--sf-primary);
  background: var(--sf-primary);
}

.auth-bar {
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: var(--sf-line);
  overflow: hidden;
}

.auth-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--sf-primary);
  transition: width 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  .auth-bar span {
    transition: none;
  }
}
</style>
