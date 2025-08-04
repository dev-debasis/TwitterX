import { Tweet } from 'react-tweet';

const TwitterTimeline = ({ tweetIds }) => {
  return (
    <div className="space-y-4">
      {tweetIds.map((id) => (
        <Tweet key={id} id={id} />
      ))}
    </div>
  );
};

export default TwitterTimeline;
