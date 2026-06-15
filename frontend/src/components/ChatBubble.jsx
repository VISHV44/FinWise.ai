export default function ChatBubble({ message, isUser }) {
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div className={isUser ? 'chat-user' : 'chat-ai'}>
        {message}
      </div>
    </div>
  );
}
