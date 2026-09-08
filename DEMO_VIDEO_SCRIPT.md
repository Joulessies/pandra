# 🎬 Pandra — Hackathon Demo Video Production Kit
> **Target Duration:** 2:30 – 2:50 minutes  
> **Key Requirement:** Demo RevenueCat Pro features & paywall within the first 3 minutes.  
> **Platform Target:** RevenueCat Shipaton 2026 (Devpost submission) & YouTube / Loom.

---

## ⏱ Scene-by-Scene Video Blueprint

```
[0:00 - 0:20] 🐼 Hook & The Problem
[0:20 - 0:50] 🪄 The Magic: Natural Language AI Widget Generator
[0:50 - 1:20] ⚙️ Developer Power: REST API JSONPath Engine
[1:20 - 1:50] 💎 RevenueCat Integration & Pro Paywall (CRITICAL FOR JUDGES)
[1:50 - 2:25] 📱 Native iOS WidgetKit & Android AppWidgets on Home Screen
[2:25 - 2:45] 🚀 Architecture, Offline Sync & Closing CTA
```

---

## 🎙 Full Scene-by-Scene Script

### 🎬 Scene 1: The Hook & The Problem (0:00 – 0:20)
* **On Screen:** Start with [`feature-graphic-banner.jpg`](assets/screenshots/feature-graphic-banner.jpg) transitioning smoothly to the live app's Command Deck ([`1-deck-overview.jpg`](assets/screenshots/1-deck-overview.jpg)). Show the soft paper background, the cute Pandra logo, and live updating cards (Bitcoin Oracle with green sparkline, 18ms API Latency, Weather, Battery).
* **Voiceover:**
  > *"Every builder, developer, and data enthusiast constantly juggles fragmented monitors — crypto charts, cloud uptimes, GitHub stars, and server health. But building custom mobile widgets has always required native Swift or Kotlin expertise and hours of boilerplate code.*  
  > *Meet **Pandra** — the AI-powered widget maker for mobile and native home screens."*

---

### 🎬 Scene 2: Natural Language AI Widget Generator (0:20 – 0:50)
* **On Screen:** Tap the glowing `+ New Widget` button or sparkles wand icon. Open the **AI Widget Generator** modal ([`2-ai-generator.jpg`](assets/screenshots/2-ai-generator.jpg)).
* **Action:** Type or paste the prompt:  
  `"Track Ethereum gas fees and alert when under 15 Gwei"`  
  Tap the magic wand icon. Show the instantaneous synthesis and the glowing preview card: `ETH Gas Tracker • 14 Gwei (-12%)` with live sparkline. Tap `+ Add to Command Deck`.
* **Voiceover:**
  > *"With Pandra, you don't need to write code. Just describe what you want in plain English.  
  > Watch: I type 'Track Ethereum gas fees and alert when under 15 Gwei'. Pandra's AI synthesizer instantly parses the request, connects the real-time endpoint, selects optimal color palettes, and generates an animated sparkline card.  
  > In one tap, it's live on my command deck."*

---

### 🎬 Scene 3: REST API & JSONPath Studio (0:50 – 1:20)
* **On Screen:** Tap on a widget or open the **Widget Studio** ([`4-api-jsonpath-studio.jpg`](assets/screenshots/4-api-jsonpath-studio.jpg)).
* **Action:** Show the API Endpoint input field pointing to `https://api.github.com/repos/joulessies/pandra`. Highlight the interactive JSON response tree where `"stargazers_count": 1,420` is highlighted with the `Extracted Path` pill. Show the polling interval slider set to `60s`.
* **Voiceover:**
  > *"For developers who want total control, Pandra includes a visual REST API Studio.  
  > Simply paste any HTTP JSON endpoint. Pandra fetches the payload and presents a visual JSONPath tree inspector. Just tap any field — like stargazers_count or server uptime — set your polling interval, and you have an enterprise-grade live telemetry stream updating in real-time."*

---

### 🎬 Scene 4: RevenueCat Monetization & Pro Paywall (1:20 – 1:50) ⭐️ *JUDGES CHECKPOINT*
* **On Screen:** Tap the **Crown / Pro** badge in the header. Transition to the **RevenueCat Paywall Modal** ([`paywall-modal.tsx`](src/components/paywall-modal.tsx)) and Theme Customizer ([`9-theme-customizer.jpg`](assets/screenshots/9-theme-customizer.jpg)).
* **Action:** Show the monthly ($3.99/mo) and annual ($29.99/yr) subscription tiers, 7-day free trial banner, and feature entitlements (Unlimited multi-deck workspaces, unlimited AI generation, 15-second polling, and cloud backup). Tap to unlock Pro and switch between glassmorphic, neon, and dark card themes.
* **Voiceover:**
  > *"To ensure long-term sustainability, Pandra is powered by a seamless RevenueCat monetization engine.  
  > Free users can build up to 4 local widgets. With **Pandra Pro**, unlocked via RevenueCat in-app subscriptions, users gain unlimited multi-deck workspaces, unlimited AI generations, 15-second high-frequency polling, and cloud syncing.  
  > RevenueCat handles all entitlements, receipt validation, and subscription lifecycle across platforms effortlessly."*

---

### 🎬 Scene 5: Native Home Screen Widgets (1:50 – 2:25)
* **On Screen:** Minimize the app to the phone's **Home Screen** ([`3-native-home-screen.jpg`](assets/screenshots/3-native-home-screen.jpg)) and **Lock Screen** ([`8-lockscreen-widgets.jpg`](assets/screenshots/8-lockscreen-widgets.jpg)).
* **Action:** Showcase the wide 4×2 DevOps Cloud Telemetry widget, 2×2 Bitcoin widget with live green sparkline, 2×2 Daily Water tracker, and the lock screen circular accessory widgets under the 9:41 clock.
* **Voiceover:**
  > *"The best part? Pandra doesn't trap your data inside the app.  
  > Through our native bridge, your custom widgets sync directly to the phone's home screen. On iOS, we leverage SwiftUI and WidgetKit supporting small, medium, and lock screen accessory widgets. On Android, our native AppWidget bridge powers responsive home screen widgets with zero battery drain.  
  > Your essential data is always with you — at a glance, without even unlocking your phone."*

---

### 🎬 Scene 6: Multi-Deck Workspaces & Wrap-Up (2:25 – 2:45)
* **On Screen:** Open Pandra and show the **Multi-Deck Workspaces** drawer ([`5-multideck-workspaces.jpg`](assets/screenshots/5-multideck-workspaces.jpg)) switching from `DevOps` ([`6-devops-telemetry.jpg`](assets/screenshots/6-devops-telemetry.jpg)) to `Crypto` ([`7-crypto-wealth.jpg`](assets/screenshots/7-crypto-wealth.jpg)). Finish on the Try It Out download screen with the panda logo.
* **Voiceover:**
  > *"Backed by Convex cloud for offline-first sync and Clerk for auth, Pandra brings peace of mind to developers, students, and power users everywhere.  
  > Download the live Android APK or clone the open-source repository today on GitHub.  
  > Thank you for checking out Pandra!"*

---

## 🛠 Recommended Recording Tools

| Method | Best For | Recommended Tool |
|:---|:---|:---|
| **Quick & High Polish** | Voiceover + Screencast | [Screen Studio](https://www.screen.studio) (Mac) or [CapCut / Clipchamp](https://www.capcut.com) (Windows) |
| **Direct Phone Screen** | Real Android phone recording | Built-in Android Screen Recorder or [scrcpy](https://github.com/Genymobile/scrcpy) (via USB to PC) |
| **All-in-One Free** | Screen + Facecam | [Loom](https://www.loom.com) or [OBS Studio](https://obsproject.com) |
| **AI Voiceover (Optional)**| If you prefer an AI voice | [ElevenLabs](https://elevenlabs.io) (Free tier) with warm friendly narrator tone |

---

## ✅ Devpost Video Submission Checklist
- [ ] Video duration is **under 3 minutes** (ideal: ~2:30).
- [ ] RevenueCat Pro subscription / Paywall is demonstrated **within the first 2 minutes**.
- [ ] AI prompt-to-widget generation is clearly shown.
- [ ] Native Home Screen / Lock screen widgets are showcased.
- [ ] Uploaded to **YouTube** (Unlisted or Public) or **Loom**, and pasted into the Devpost submission field.
