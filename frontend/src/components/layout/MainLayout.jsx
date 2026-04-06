import Header from './Header';
import Footer from './Footer';

export default function MainLayout({children}) {
	return (
		<div className="min-h-screen bg-white text-gray-900">
			<Header />
			<main>{children}</main>
			<Footer />
		</div>
	);
}
