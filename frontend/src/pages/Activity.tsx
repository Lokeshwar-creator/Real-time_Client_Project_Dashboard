import ActivityFeed from "../components/ActivityFeed";

export default function Activity() {
  return (
    <div>
      <div className="page-heading">
        <div>
          <h2>
            Activity
          </h2>

          <p>
            Track project activity in real time.
          </p>
        </div>
      </div>

      <ActivityFeed />
    </div>
  );
}