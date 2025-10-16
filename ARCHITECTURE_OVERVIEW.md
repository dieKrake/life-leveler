# Life Leveling App - Architecture Overview

## 🏗️ System Architecture

### Frontend (Next.js + React)
- **Framework**: Next.js 14 with App Router
- **UI**: TailwindCSS + shadcn/ui components
- **Animations**: Framer Motion
- **State Management**: SWR for data fetching and caching
- **Notifications**: Sonner for toast messages

### Backend (Supabase)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **Functions**: PostgreSQL stored procedures
- **Real-time**: Supabase subscriptions

### External Integrations
- **Google Calendar API**: For todo synchronization
- **Google Tasks API**: For task management

## 📊 Database Schema

### Core Tables

#### `todos`
```sql
- id: BIGINT (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- google_event_id: TEXT (Google Calendar/Tasks ID)
- title: TEXT
- start_time: TIMESTAMP WITH TIME ZONE
- end_time: TIMESTAMP WITH TIME ZONE
- is_completed: BOOLEAN
- created_at: TIMESTAMP WITH TIME ZONE
- xp_value: INTEGER (10, 20, or 30)
- completed_at: TIMESTAMP WITH TIME ZONE
- archived_at: TIMESTAMP WITH TIME ZONE
- completed_xp: INTEGER (actual XP awarded with multiplier)
- completed_gems: INTEGER (gems awarded)
- completed_difficulty: TEXT (easy, medium, hard)
```

#### `player_stats`
```sql
- user_id: UUID (Primary Key)
- xp: INTEGER (current level XP)
- level: INTEGER
- total_xp: INTEGER (lifetime XP)
- gems: INTEGER
- current_streak: INTEGER
- highest_streak: INTEGER
- prestige: INTEGER
- max_level_reached: INTEGER
- gems_at_last_prestige: INTEGER
- tasks_at_last_prestige: INTEGER
- xp_at_last_prestige: INTEGER
- total_tasks_completed: INTEGER
```

#### `challenges`
```sql
- id: UUID (Primary Key)
- title: TEXT
- description: TEXT
- type: TEXT (daily, weekly)
- condition_type: TEXT (complete_count, complete_difficulty, complete_before_time, earn_xp)
- target_value: INTEGER
- target_metadata: JSONB
- xp_reward: INTEGER
- gem_reward: INTEGER
- is_active: BOOLEAN
- sort_order: INTEGER
```

#### `user_challenges`
```sql
- id: UUID (Primary Key)
- user_id: UUID
- challenge_id: UUID
- progress: INTEGER
- completed: BOOLEAN
- completed_at: TIMESTAMP WITH TIME ZONE
- expires_at: TIMESTAMP WITH TIME ZONE
- claimed: BOOLEAN
- claimed_at: TIMESTAMP WITH TIME ZONE
```

## 🔧 Core Functions

### Todo Management

#### `complete_todo(todo_id BIGINT)`
**Purpose**: Complete a todo and award XP/gems with streak multiplier
**Process**:
1. Mark todo as completed with timestamp
2. Calculate difficulty based on XP value (10=easy, 20=medium, 30=hard)
3. Apply streak multiplier to XP
4. Update player stats (XP, gems, level)
5. Store completion data for potential reversal
6. Update challenge progress
7. Return level-up info and unlockable content

#### `uncomplete_todo(todo_id BIGINT)`
**Purpose**: Reverse todo completion and remove awarded XP/gems
**Process**:
1. Retrieve stored completion data (XP, gems, difficulty)
2. Remove exact XP/gems that were awarded
3. Reverse challenge progress (only unclaimed challenges)
4. Clear completion data

### Challenge System

#### `check_and_update_challenges_on_todo_complete()`
**Purpose**: Update challenge progress when todo is completed
**Challenge Types**:
- `complete_count`: Increment by 1
- `complete_difficulty`: Increment by 1 if difficulty matches
- `complete_before_time`: Increment by 1 if completed before target time
- `earn_xp`: Increment by XP earned

#### `check_and_reverse_challenges_on_todo_uncomplete()`
**Purpose**: Reverse challenge progress when todo is uncompleted
**Important**: Only affects **unclaimed** challenges to prevent exploitation

#### `claim_challenge_reward(user_challenge_id UUID)`
**Purpose**: Award XP/gems when user claims completed challenge
**Process**:
1. Validate challenge is completed and not claimed
2. Award XP and gems to player
3. Mark challenge as claimed
4. Record in challenge_completions table

### Player Progression

#### `update_player_xp_and_gems(xp_change INTEGER, gems_change INTEGER)`
**Purpose**: Update player XP, gems, and handle level changes
**Features**:
- Automatic level up/down calculation
- Level cap at 10
- Prevents negative gems
- Updates max_level_reached

#### `get_streak_multiplier(streak_days INTEGER)`
**Purpose**: Calculate XP multiplier based on current streak
**Multipliers**:
- 0+ days: 1.0x
- 3+ days: 1.2x
- 7+ days: 1.5x
- 14+ days: 2.0x
- 18+ days: 2.2x
- 21+ days: 2.5x
- 25+ days: 3.0x

## 🎯 Key Features

### Difficulty System
- **Easy (10 XP)**: 1 gem reward
- **Medium (20 XP)**: 2 gems reward  
- **Hard (30 XP)**: 4 gems reward
- XP multiplied by streak multiplier
- Original difficulty stored for accurate reversal

### Challenge System
- **Daily Challenges**: Reset at midnight
- **Weekly Challenges**: Reset on Monday
- **Claim System**: Manual claiming prevents exploitation
- **Progress Reversal**: Only affects unclaimed challenges

### Streak System
- Login-based streak tracking
- Automatic multiplier calculation
- Streak affects XP but not gems
- Highest streak tracking

### Achievement System
- Progress tracking across prestiges
- Automatic unlock detection
- Gem rewards for achievements
- Categories: tasks, streak, level, xp, gems

## 🔒 Security Features

### Row Level Security (RLS)
- All tables have RLS policies
- Users can only access their own data
- Authentication required for all operations

### Function Security
- All functions use `SECURITY DEFINER`
- Input validation and sanitization
- Proper error handling
- Audit logging with RAISE NOTICE

## 🚀 Performance Optimizations

### Frontend
- SWR for efficient data caching
- Optimistic updates for better UX
- Debounced API calls
- Lazy loading of components

### Backend
- Indexed foreign keys
- Efficient query patterns
- Minimal data transfer
- Batch operations where possible

## 🐛 Error Handling

### Frontend
- Comprehensive try-catch blocks
- User-friendly error messages
- Automatic retry mechanisms
- Fallback UI states

### Backend
- Proper exception handling
- Detailed error logging
- Graceful degradation
- Input validation

## 📱 API Endpoints

### `/api/complete-todo`
- **Method**: POST
- **Purpose**: Complete/uncomplete todos
- **Includes**: Google Calendar/Tasks sync

### `/api/challenges`
- **Method**: GET
- **Purpose**: Fetch user challenges
- **Features**: Auto-initialization, expiry handling

### `/api/claim-challenge`
- **Method**: POST
- **Purpose**: Claim challenge rewards

### `/api/player-stats`
- **Method**: GET
- **Purpose**: Fetch player statistics with level info

### `/api/achievements`
- **Method**: GET
- **Purpose**: Fetch user achievements with progress

## 🔄 Data Flow

### Todo Completion Flow
1. User clicks checkbox in UI
2. Optimistic UI update
3. API call to `/api/complete-todo`
4. Database function `complete_todo()` executes
5. Challenge progress updated automatically
6. Player stats updated
7. Google sync (if applicable)
8. UI refreshed with new data
9. Reward notifications shown

### Challenge Claim Flow
1. User clicks "Einfordern" button
2. Optimistic UI update (mark as claimed)
3. API call to `/api/claim-challenge`
4. Database function `claim_challenge_reward()` executes
5. XP/gems awarded to player
6. UI refreshed
7. Reward notification shown

## 🎨 UI/UX Features

### Animations
- Framer Motion for smooth transitions
- Layout animations for list items
- Staggered entry animations
- Hover effects and micro-interactions

### Responsive Design
- Mobile-first approach
- Adaptive layouts
- Touch-friendly interactions
- Optimized for all screen sizes

### Accessibility
- Keyboard navigation
- Screen reader support
- High contrast support
- Focus management

## 🔧 Development Guidelines

### Code Organization
- Modular component structure
- Separation of concerns
- Reusable utility functions
- Consistent naming conventions

### Database Migrations
- Sequential migration files
- Rollback capabilities
- Version control integration
- Testing procedures

### Testing Strategy
- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Database function testing

## 📈 Monitoring & Analytics

### Performance Monitoring
- API response times
- Database query performance
- Frontend rendering metrics
- Error rates and patterns

### User Analytics
- Feature usage tracking
- Completion rates
- User engagement metrics
- Retention analysis
