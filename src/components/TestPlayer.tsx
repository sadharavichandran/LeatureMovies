import React from 'react';
import ReactPlayer from 'react-player';

export default function TestPlayer() {
  return (
    <div style={{ width: '800px', height: '600px', backgroundColor: 'black' }}>
      <ReactPlayer url="https://www.youtube.com/watch?v=fJaAYcERf3Y" controls />
    </div>
  );
}
