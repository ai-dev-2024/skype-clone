import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { socketService } from '../services/socket'
import { MessageReaction, ReactionType } from '@skype-clone/shared'

interface MessageReactionsProps {
  messageId: string
  reactions?: MessageReaction[]
  onReactionChange?: () => void
}

const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  laugh: '😂',
  angry: '😠',
  sad: '😢',
  wow: '😮',
  thumbs_up: '👍',
  thumbs_down: '👎'
}

const REACTION_NAMES: Record<ReactionType, string> = {
  like: 'Like',
  love: 'Love',
  laugh: 'Laugh',
  angry: 'Angry',
  sad: 'Sad',
  wow: 'Wow',
  thumbs_up: 'Thumbs Up',
  thumbs_down: 'Thumbs Down'
}

const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions = [],
  onReactionChange
}) => {
  const { user } = useAuth()
  const [showPicker, setShowPicker] = useState(false)

  // Group reactions by type and count users
  const reactionCounts = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.reaction]) {
      acc[reaction.reaction] = { count: 0, users: [], hasUserReacted: false }
    }
    acc[reaction.reaction].count++
    acc[reaction.reaction].users.push(reaction.userId)
    if (reaction.userId === user?.id) {
      acc[reaction.reaction].hasUserReacted = true
    }
    return acc
  }, {} as Record<ReactionType, { count: number; users: string[]; hasUserReacted: boolean }>)

  const handleReactionClick = (reaction: ReactionType) => {
    if (!user) return

    const hasReacted = reactionCounts[reaction]?.hasUserReacted

    if (hasReacted) {
      // Remove reaction
      socketService.removeMessageReaction(messageId, reaction)
    } else {
      // Add reaction
      socketService.addMessageReaction(messageId, reaction)
    }

    onReactionChange?.()
    setShowPicker(false)
  }

  const reactionEntries = Object.entries(reactionCounts) as [ReactionType, { count: number; users: string[]; hasUserReacted: boolean }][]

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {/* Existing reactions */}
      {reactionEntries.map(([reaction, data]) => (
        <button
          key={reaction}
          onClick={() => handleReactionClick(reaction)}
          className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
            data.hasUserReacted
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
          }`}
          title={`${REACTION_NAMES[reaction]} (${data.count})`}
        >
          <span>{REACTION_EMOJIS[reaction]}</span>
          <span>{data.count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700"
          title="Add reaction"
        >
          <span className="text-sm">+</span>
        </button>

        {/* Reaction picker */}
        {showPicker && (
          <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
            <div className="grid grid-cols-4 gap-1">
              {Object.entries(REACTION_EMOJIS).map(([reaction, emoji]) => (
                <button
                  key={reaction}
                  onClick={() => handleReactionClick(reaction as ReactionType)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                  title={REACTION_NAMES[reaction as ReactionType]}
                >
                  <span className="text-lg">{emoji}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageReactions
