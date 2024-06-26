<script lang="ts">
  import { Icons } from '$components/elements';
  import { Button } from '$components/ui/button';
  import { Input } from '$components/ui/input';
  import { Label } from '$components/ui/label';
  import { slide } from 'svelte/transition';
  import owasp from 'owasp-password-strength-test';
  import InputPassword from '$components/InputPassword.svelte';
  import { cn } from '$lib/utils';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { userService } from '$lib/stores/user';
  import GenerateKeyDialog from '$components/GenerateKeyDialog.svelte';

  let className: string | undefined | null = undefined;
  export { className as class };

  let isLoading = false;
  let password = '';
  let password2 = '';
  let key = '';
  let isStrong = false;
  let strength = 0;
  let passwordsMatch = false;
  let passwordError = '';
  let barColor = 'bg-gray-400'; // Default color

  let openGenerateKeyDialog = false;

  async function onSubmit() {
    isLoading = true;
    let res = await userService.registerUserCloud(password, key).catch((e) => {
      toast.error('Failed to register', {
        description: e.message
      });
      isLoading = false;
      throw e;
    });
    isLoading = false;
    if (res == true) {
      toast.info('Registered Successfully', {
        description: 'Please Login Now'
      });
      goto('/auth/login');
    } else {
      toast.error('Failed to register', {
        description: 'Please try again'
      });
    }
  }

  function calculateStrength(password: string) {
    var result = owasp.test(password);
    passwordError = result.errors.length > 0 ? result.errors[0] : '';
    strength = Math.max(
      Math.min(password.length * 5 + result.passedTests.length * 10, 100) -
        result.errors.length * 30,
      0
    );
    if (strength < 20 || result.errors.length > 0) {
      barColor = 'bg-red-500';
    } else if (strength < 40) {
      barColor = 'bg-yellow-500';
    } else if (strength < 60) {
      barColor = 'bg-blue-500';
    } else if (strength < 80) {
      barColor = 'bg-green-500';
    } else {
      barColor = 'bg-green-500';
    }
    isStrong = result.strong;
    strength = password.length > 0 ? strength : 0;
  }

  $: calculateStrength(password);
  $: passwordsMatch = password === password2;
</script>

<div class="lg:p-8">
  <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
    <div class="flex flex-col space-y-2">
      <h1 class="text-2xl font-semibold tracking-tight text-center">First Setup</h1>
      <p class="text-sm text-muted-foreground">
        Enter your secret below to setup the application. The secret should be different from the
        password you use to login to CTB Cloud.
      </p>
    </div>
    <div class={cn('grid gap-6', className)} {...$$restProps}>
      <form>
        <div class="grid gap-2">
          <div class="grid gap-1 mt-2">
            <Label class="mb-1" for="password">Secret:</Label>
            <InputPassword bind:value={password} />
          </div>
          <div class="grid gap-1">
            <Label class="sr-only" for="password-2">Secret repeat</Label>
            <Input
              id="password-2"
              placeholder="Repeat your strong secret"
              type="password"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isLoading}
              bind:value={password2}
            />
            {#if !passwordsMatch && password2.length > 0}
              <p transition:slide class="text-red-500 text-sm">Passwords do not match</p>
            {/if}
          </div>
          <div class="grid gap-1 mt-1">
            <Label class="mb-1" for="key">Private Key:</Label>
            <div class="flex">
              <Input
                id="key"
                class="flex-1"
                placeholder="Your private key"
                type="password"
                autoCorrect="off"
                disabled={isLoading}
                bind:value={key}
              />
              <Button
                type="button"
                class="ml-2"
                disabled={isLoading}
                on:click={() => (openGenerateKeyDialog = true)}
              >
                Generate
              </Button>
            </div>
          </div>
          <Button disabled={isLoading || !passwordsMatch || !isStrong} on:click={onSubmit}>
            {#if isLoading}
              <Icons.spinner class="mr-2 h-4 w-4 animate-spin" />
            {/if}
            Join
          </Button>
        </div>
      </form>
    </div>
    <p class="px-8 text-center text-sm text-muted-foreground">
      By clicking continue, you agree to our Terms of Service and Privacy Policy.
    </p>
  </div>
</div>

<GenerateKeyDialog bind:open={openGenerateKeyDialog} bind:key />
