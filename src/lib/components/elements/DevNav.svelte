<script lang="ts">
  import { page } from '$app/stores';
  import { pages } from '$lib/config/pages';
  import { cn } from '$lib/utils';

  let className: string | undefined | null = undefined;
  export { className as class };
</script>

<div class="w-full">
  <div class={cn('', className)} {...$$restProps}>
    {#each pages as example, index (index)}
      <a
        href={example.href}
        class={cn(
          'px-2',
          $page.url.pathname.startsWith(example.href)
            ? 'font-bold text-primary'
            : 'font-medium text-muted-foreground'
        )}
      >
        {example.name}
      </a>
    {/each}
  </div>
</div>
