import React from 'react';

interface SelectedConversationHeaderProps {
  conversation: {
    id: number;
    title?: string;
    participants: number[];
    isGroup: boolean;
  };
  currentUserId: number;
  getOtherUserName: (participants: number[]) => string;
  getParticipantsNames: (participants: number[]) => string;
}

const SelectedConversationHeader: React.FC<SelectedConversationHeaderProps> = ({
  conversation,
  getOtherUserName,
  getParticipantsNames
}) => {
  const displayName = conversation.title || getOtherUserName(conversation.participants);
  
  return (
    <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${conversation.isGroup ? "bg-blue-500" : "bg-green-500"}`}>
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="font-semibold">{displayName}</h2>
          <p className="text-sm text-gray-500">
            {conversation.isGroup ? getParticipantsNames(conversation.participants) : "Discussion privée"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-1">
          {conversation.isGroup ? `${conversation.participants.length} participants` : "1 participant"}
        </span>
      </div>
    </div>
  );
};

export default SelectedConversationHeader;