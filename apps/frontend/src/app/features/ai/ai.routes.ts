import { Routes } from '@angular/router';

export const AI_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./assistant/ai-assistant.component').then((m) => m.AiAssistantComponent),
  },
];
