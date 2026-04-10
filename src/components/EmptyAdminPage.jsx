const EmptyAdminPage = ({ title }) => {
  return (
    <div className="min-h-screen darkthemebg pt-32 px-4">
      <div className="max-w-4xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-8 md:p-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white">{title}</h1>
        <p className="mt-3 text-gray-300">
          This section is intentionally empty for admin view right now.
        </p>
      </div>
    </div>
  );
};

export default EmptyAdminPage;
