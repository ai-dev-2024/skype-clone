# 🗣️ Daily Standup Process

## Overview

Daily standups are 15-minute synchronized meetings where team members quickly share progress, plans, and impediments. This keeps everyone aligned and identifies blockers early.

## ⏰ Standup Schedule

### Timing
- **Frequency**: Daily (Monday - Friday)
- **Duration**: 15 minutes maximum
- **Time**: 9:00 AM (team time zone)
- **Format**: Video call with camera on

### Participation Rules
- **Required**: All agents must attend
- **On Time**: Start promptly at scheduled time
- **Prepared**: Come prepared with updates
- **Focused**: Stay on topic and be concise

## 📋 Standup Format

### Three Questions (Per Person)
Answer in 1-2 minutes per person:

#### 1. What did I accomplish yesterday?
- Focus on completed work and achievements
- Reference story IDs and acceptance criteria
- Highlight any challenges overcome

#### 2. What am I working on today?
- Current tasks and priorities
- Next steps in active stories
- Dependencies or handoffs needed

#### 3. What obstacles are blocking me?
- Technical blockers
- Resource constraints
- External dependencies
- Priority conflicts

### Standup Flow
```
1. Scrum Master facilitates (rotates weekly)
2. Go around circle (same order each time)
3. Each person answers three questions
4. Note blockers for follow-up
5. End with sprint progress update
```

## 📊 Sprint Progress Tracking

### Daily Metrics (Shared at End)
- **Sprint Burndown**: Story points remaining
- **Sprint Goal Progress**: Percentage complete
- **Quality Metrics**: Test coverage, lint status
- **Risk Status**: Any new risks or changes

### Sprint Burndown Example
```
Sprint 12: Cross-Platform Foundation
Day 1: 85 points remaining (100%)
Day 2: 82 points remaining (96%)
Day 3: 78 points remaining (92%)
Day 4: 75 points remaining (88%)
Day 5: 72 points remaining (85%)
```

## 🚨 Blocker Management

### Identifying Blockers
- **Technical**: Code issues, environment problems
- **Resource**: Missing tools, access permissions
- **Knowledge**: Need for clarification or help
- **External**: Third-party service issues, dependencies

### Blocker Resolution Process
1. **During Standup**: Identify and acknowledge blocker
2. **Immediate Action**: Assign owner for resolution
3. **Follow-up**: Update in next standup
4. **Escalation**: Escalate to scrum master if unresolved after 24 hours

### Blocker Template
```
Blocker: [Brief description]
Impact: [High/Medium/Low - effect on sprint goal]
Owner: [Person responsible for resolution]
ETA: [Expected resolution time]
Status: [Open/In Progress/Resolved]
```

## 📈 Standup Metrics

### Effectiveness Metrics
- **Duration**: Average standup time (target: <15 minutes)
- **Participation**: Attendance percentage (target: 100%)
- **Blockers Resolved**: Time to resolve blockers (target: <24 hours)
- **Sprint Predictability**: Burndown accuracy

### Quality Metrics
- **Action Items**: Percentage completed (target: >90%)
- **Meeting Efficiency**: Value delivered vs time spent
- **Team Communication**: Blocker identification rate

## 📋 Standup Preparation

### Pre-Standup Checklist (Individual)
- [ ] Review yesterday's accomplishments
- [ ] Plan today's work priorities
- [ ] Identify any potential blockers
- [ ] Check sprint progress metrics
- [ ] Prepare story updates if applicable

### Pre-Standup Checklist (Scrum Master)
- [ ] Prepare sprint burndown chart
- [ ] Review blocker status from previous day
- [ ] Have parking lot ready for off-topic items
- [ ] Prepare agenda if needed

## 🚀 Standup Best Practices

### Facilitation Tips
- **Time Management**: Keep everyone concise
- **Active Listening**: Pay attention and take notes
- **Parking Lot**: Note off-topic items for later
- **Positive Tone**: Maintain collaborative atmosphere
- **Action Orientation**: Focus on solutions, not problems

### Participation Guidelines
- **Be Prepared**: Have your update ready
- **Be Concise**: Respect others' time
- **Be Honest**: Don't hide problems or blockers
- **Be Constructive**: Focus on facts and solutions
- **Be Present**: No multitasking during standup

## 📝 Standup Documentation

### Standup Notes Template
```markdown
# Daily Standup - [Date]

## Sprint Progress
- **Sprint**: Sprint 12 (Cross-Platform Foundation)
- **Days Remaining**: [X] days
- **Points Remaining**: [X] points ([X]%)
- **Sprint Goal**: [X]% complete

## Team Updates

### Backend-Lead
- **Yesterday**: Completed STORY-125 (API rate limiting)
- **Today**: Working on STORY-126 (encryption setup)
- **Blockers**: None

### Frontend-Lead
- **Yesterday**: Completed STORY-119 (component library)
- **Today**: Working on STORY-123 (mobile navigation)
- **Blockers**: React Native setup issues

### DevOps-Lead
- **Yesterday**: Completed STORY-121 (CI/CD pipeline)
- **Today**: Working on STORY-127 (testing pipeline)
- **Blockers**: None

## Blockers & Action Items
- [ ] [Frontend-Lead] Investigate React Native setup alternatives
- [ ] [Team] Schedule cross-platform testing session

## Parking Lot
- Performance optimization discussion (schedule for tomorrow)
- New monitoring tool evaluation (add to backlog)
```

### Documentation Requirements
- [ ] Standup notes published within 30 minutes
- [ ] Blockers tracked with owners and ETAs
- [ ] Action items assigned and followed up
- [ ] Sprint metrics updated daily

## 🎯 Standup Anti-Patterns

### Avoid These Common Issues
- ❌ **Status Meetings**: Don't turn into detailed status reports
- ❌ **Problem Solving**: Save problem solving for after standup
- ❌ **Missing Participation**: Everyone must participate
- ❌ **Going Over Time**: Respect the 15-minute limit
- ❌ **No Follow-up**: Blockers must be addressed

### Solutions
- **For Long Updates**: "Let's discuss this after standup"
- **For Missing People**: Call them during standup
- **For Overruns**: Scrum master intervenes to keep on track
- **For No Updates**: "I'm still working on [story], no blockers"

## 📊 Standup Health Check

### Monthly Assessment Questions
1. Are standups starting and ending on time?
2. Are all team members participating actively?
3. Are blockers being identified and resolved quickly?
4. Is the team staying aligned on sprint goals?
5. Are standup outcomes driving actual progress?

### Improvement Actions
- Adjust timing if consistently over 15 minutes
- Provide coaching for quiet participants
- Review blocker resolution process
- Revisit sprint planning if misalignment occurs
- Experiment with format if effectiveness declines

---

*Template Version: 1.0*
*Last Updated: September 27, 2025*
