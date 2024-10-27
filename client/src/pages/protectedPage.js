import withAuth from '../components/withAuth';

const ProtectedPage = () => {
  return <div>Protected Content</div>;
};

export default withAuth(ProtectedPage);

