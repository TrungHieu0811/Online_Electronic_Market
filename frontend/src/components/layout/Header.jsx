import api from '@/services/api';
import {faMagnifyingGlass} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {Search, User, ShoppingCart, LogOut, Package, LogIn, Home} from 'lucide-react';
import {useEffect, useState, useRef, useCallback} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {toast} from 'react-toastify';
import CartBadge from '../user/cart/CartBadge';

// const categories = ['Mobiles', 'Laptops', 'TV & Audio', 'Appliances', 'Accessories'];

export default function Header() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [searchInput, setSearchInput] = useState('');
	const [searchResults, setSearchResults] = useState([]);
	const [showResults, setShowResults] = useState(false);
	const [loading, setLoading] = useState(false);
	const [categories, setCategories] = useState([]);
	const debounceTimer = useRef(null);
	const IMAGE_BASE_URL = 'http://localhost:8080/uploads';
	useEffect(() => {
		const keywordFromUrl = searchParams.get('keyword'); // Lấy giá trị của tham số ?keyword=
		if (keywordFromUrl) {
			setSearchInput(keywordFromUrl);
		} else {
			setSearchInput(''); // Xóa trắng nếu URL không có keyword
		}
	}, [searchParams]); // Chạy lại mỗi khi URL thay đổi

	// Fetch search results with debounce
	const fetchSearchResults = useCallback(async (query) => {
		if (!query.trim()) {
			setSearchResults([]);
			setShowResults(false);
			return;
		}

		setLoading(true);
		try {
			const searchParams = {
				keyword: query,
				size: 6,
				sort: ['status,asc', 'createdAt,asc'],
			};
			console.log('Params gửi đi:', searchParams);
			const res = await api.get('/public/products', {
				params: searchParams,
				paramsSerializer: {
					indexes: null,
				},
			});
			setSearchResults(res.data?.content ?? []);
			setShowResults(true);
		} catch (e) {
			console.error('Search error:', e);
			setSearchResults([]);
		} finally {
			setLoading(false);
		}
	}, []);

	const handleSearch = (e) => {
		e.preventDefault();
		if (searchInput.trim()) {
			// Chuyển hướng sang trang search
			navigate(`/products/search?keyword=${encodeURIComponent(searchInput.trim())}`);

			// 1. Xóa sạch kết quả tìm kiếm nhanh để dropdown biến mất
			setSearchResults([]);

			// 2. Nếu bạn có dùng state riêng để ẩn/hiện (ví dụ: showResults) thì set nó về false
			setShowResults(false);
		}
	};

	const handleSearchInputChange = (e) => {
		const value = e.target.value;
		setSearchInput(value);

		// Clear previous timer
		if (debounceTimer.current) {
			clearTimeout(debounceTimer.current);
		}

		// Set new timer with 500ms delay
		debounceTimer.current = setTimeout(() => {
			fetchSearchResults(value);
		}, 500);
	};

	const handleProductClick = (slug) => {
		setShowResults(false);
		setSearchInput('');
		setSearchResults([]);
		navigate(`/products/${slug}`);
	};

	// Cleanup timer on unmount
	useEffect(() => {
		return () => {
			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current);
			}
		};
	}, []);
	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const res = await api.get('/public/categories/tree');
				setCategories(res.data || []);
			} catch (e) {
				console.error('Failed to fetch categories:', e);
			}
		};
		fetchCategories();
	}, []);

	// Kiểm tra xem có token trong máy không để biết đã đăng nhập chưa
	const isAuthenticated = !!localStorage.getItem('token');

	// Hàm xử lý đăng xuất
	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('refreshToken');
		toast.info('You have logged out.');
		navigate('/');
		window.location.reload(); // Tải lại trang để Header cập nhật giao diện
	};

	return (
		<header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
			{/* Top Bar */}
			<div className="bg-[#045fae] px-4 py-2 text-xs text-white">
				<div className="mx-auto flex max-w-6xl items-center justify-between">
					<span>Free International Shipping on orders over $500</span>

					<div className="flex gap-4">
						<a href="#" className="hover:underline">
							Store Locator
						</a>
						<a href="#" className="hover:underline">
							Track Order
						</a>
					</div>
				</div>
			</div>
			<div className="border-t border-gray-100 bg-gray-50">
				{/* Main Nav */}
				<nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
					{/* Logo */}
					<a href="/" className="flex items-center gap-1 text-2xl font-extrabold text-[#045fae]">
						<span className="italic text-[#FFD700]">Electro</span>Mart
					</a>

					{/* Search Form - with Live Results Dropdown */}
					<div className="flex-1 max-w-md relative">
						<form className="flex" onSubmit={handleSearch}>
							<input
								type="text"
								value={searchInput}
								onChange={handleSearchInputChange}
								onFocus={() => searchResults.length > 0 && setShowResults(true)}
								placeholder="Tìm kiếm sản phẩm..."
								className="w-full px-4 py-2 border border-gray-200 rounded-l-lg text-sm outline-none focus:border-blue-500"
							/>
							<button
								onClick={handleSearch}
								className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-r-lg transition-colors flex-shrink-0"
							>
								<FontAwesomeIcon icon={faMagnifyingGlass} style={{fontSize: 14}} />
							</button>
						</form>

						{/* Search Results Dropdown */}
						{showResults && searchResults.length > 0 && (
							<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
								{loading ? (
									<div className="p-4 text-center text-gray-500">Đang tìm kiếm...</div>
								) : searchResults.length > 0 ? (
									<div className="divide-y divide-gray-100">
										{searchResults.map((product) => {
											const primaryImage = product.imageList?.[0]?.imageUrl;
											const variantName = product.variants?.[0]?.name;
											const isActive = product.status === 'ACTIVE';
											return (
												<div
													key={product.id}
													onClick={() => handleProductClick(product.slug)}
													className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${!isActive ? 'hidden' : ''}`}
													// className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors `}
												>
													<img
														src={primaryImage?.startsWith('/') ? IMAGE_BASE_URL + primaryImage : primaryImage}
														alt={variantName}
														onError={() => setHasError(true)}
														className={`w-10 h-10 border border-gray-200 rounded-md object-cover
							${!isActive ? 'grayscale' : ''}`}
													/>
													{/* Product Info */}
													<div className="flex-1 min-w-0">
														<h4 className="text-sm font-medium text-gray-900 truncate">{product.variantName}</h4>
														<p>
															<span className="text-lg text-red-600 font-lightbold">
																${product.salePrice?.toLocaleString('en-us')}
															</span>
															{product.basePrice > product.salePrice && (
																<>
																	<span className="text-xs text-gray-400 line-through ml-2">
																		${product.basePrice?.toLocaleString('en-us')}
																	</span>
																	<span className=" top-2 right-2 text-sm font-medium px-2 py-0.5 rounded bg-amber-50 text-red-600 ml-5">
																		-{(((product.basePrice - product.salePrice) / product.basePrice) * 100) | 0}%
																	</span>
																</>
															)}
														</p>
													</div>
												</div>
											);
										})}
									</div>
								) : (
									<div className="p-4 text-center text-gray-500">Không tìm thấy sản phẩm</div>
								)}
							</div>
						)}
					</div>

					{/* Actions */}
					<div className="flex items-center gap-6">
						{/* 👉 HIỂN THỊ ĐỘNG DỰA VÀO TRẠNG THÁI LOGIN */}
						{isAuthenticated ? (
							// ĐÃ LOGIN: Hiện Profile, Orders, Logout
							<div className="flex items-center gap-4 border-r pr-4 border-gray-200">
								<Link to="/profile" className="flex items-center gap-1 text-gray-700 hover:text-[#045fae]">
									<User className="h-5 w-5" />
									<span className="hidden text-sm font-medium md:block">Profile</span>
								</Link>

								{/* <Link to='/profile/orders' className='flex items-center gap-1 text-gray-700 hover:text-[#045fae]'>
                                <Package className='h-5 w-5' />
                                <span className='hidden text-sm font-medium md:block'>Orders</span>
                            </Link> */}

								<button
									onClick={handleLogout}
									className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors ml-2"
								>
									<LogOut className="h-5 w-5" />
									<span className="hidden text-sm font-medium md:block">Logout</span>
								</button>
							</div>
						) : (
							// CHƯA LOGIN: Hiện nút Login
							<Link to="/login" className="flex items-center gap-2 text-gray-700 hover:text-[#045fae]">
								<LogIn className="h-6 w-6" />
								<span className="hidden text-sm font-medium md:block">Login</span>
							</Link>
						)}

						<Link to="/cart">
							<CartBadge />
						</Link>
					</div>
				</nav>

				{/* Categories */}
				<div className="mx-auto max-w-6xl px-4">
					<ul className="flex overflow-x-auto whitespace-nowrap py-3 text-sm font-semibold uppercase tracking-wider text-gray-700">
						<li className="mr-8">
							<a href="/" className="flex items-center gap-2 hover:text-[#045fae]">
								<Home className="h-5 w-5" />
								HOME
							</a>
						</li>

						{categories.map((item) => (
							<li key={item.id} className="mr-8">
								<Link to={`/category/${item.slug}`} className="hover:text-[#045fae]">
									{item.name}
								</Link>
							</li>
						))}
					</ul>
				</div>
			</div>
		</header>
	);
}
