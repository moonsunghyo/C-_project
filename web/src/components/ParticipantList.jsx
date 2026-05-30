import Icon from './Icon.jsx';

export default function ParticipantList({ participants }) {
  return (
    <div className="participant-list">
      <div className="participant-header">
        <Icon name="users" size={16} stroke={1.8} />
        <span className="participant-title">참여 학생 ({participants.length})</span>
      </div>
      <div className="participant-content">
        {participants.length === 0 ? (
          <div className="participant-empty">접속한 학생이 없습니다.</div>
        ) : (
          participants.map((user, idx) => (
            <div key={idx} className="participant-item">
              <input type="checkbox" checked={true} readOnly />
              <span className="participant-name">{user}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
