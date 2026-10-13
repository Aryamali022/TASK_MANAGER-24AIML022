import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// The only file that imports recharts. Keeping the import here (and loading
// this component with React.lazy) keeps recharts out of the main bundle.
function TaskChart({ done, pending }) {
  const data = [
    { name: 'Completed', count: done },
    { name: 'Pending', count: pending },
  ];

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TaskChart;
