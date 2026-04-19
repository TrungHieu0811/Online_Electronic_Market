import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faStar,
    faStarHalfStroke,
    faShield,
    faTruck,
    faBoxOpen,
    faCartPlus,
    faBolt,
    faChevronRight,
    faEye,
    faMinus,
    faPlus,
    faChevronLeft
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarEmpty, faHeart } from '@fortawesome/free-regular-svg-icons';
// import api from '../../services/api';
import QuestionAnswerSection from '@/features/comment/QuestionAnswerSection';
// import api from '../../../services/api';
import api from '../../../services/api';
import AddToCartButton from '@/components/user/cart/AddToCartButton';
import BuyNowButton from '@/components/user/cart/BuyNowButton';
import CustomerReviewsSection from '@/components/productComponents/CustomerReviewsSection';

const IMAGE_BASE_URL = 'http://localhost:8080/uploads';

// CSS for hiding scrollbar
const scrollbarHideStyle = `
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = scrollbarHideStyle;
    document.head.appendChild(style);
}

function resolveUrl(url) {
    if (!url) return null;
    return url.startsWith('/') ? IMAGE_BASE_URL + url : url;
}

function StarRating({ rating, count }) {
    const snapped = Math.round(rating * 2) / 2;
    return (
        <div className='flex items-center gap-1.5'>
            <div className='flex items-center gap-0.5'>
                {[1, 2, 3, 4, 5].map((i) => {
                    const full = snapped >= i;
                    const half = snapped >= i - 0.5 && snapped < i;
                    return (
                        <FontAwesomeIcon
                            key={i}
                            icon={full ? faStar : half ? faStarHalfStroke : faStarEmpty}
                            style={{ fontSize: 14, color: full || half ? '#EF9F27' : '#D3D1C7' }}
                        />
                    );
                })}
            </div>
            <span className='text-sm text-gray-500'>
                {rating.toFixed(1)}
                {count != null && <span className='ml-1'>({count} reviews)</span>}
            </span>
        </div>
    );
}

function fmtPrice(v) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

function discountPct(base, sale) {
    if (base <= sale) return 0;
    return Math.round(((base - sale) / base) * 100);
}

export default function ProductDetailPage() {
    const { slug } = useParams();
    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeImg, setActiveImg] = useState(0);
    const [qty, setQty] = useState(1);
    const [wishlisted, setWishlisted] = useState(false);
    const [hasImageError, setHasImageError] = useState(false);
    const [thumbnailScrollPos, setThumbnailScrollPos] = useState(0);
    const navigate = useNavigate();

    // Keyboard navigation for carousel
    useEffect(() => {
        const handleKeyDown = (e) => {
            const images = product?.imageList?.length ?? 0;
            if (images <= 1) return;

            if (e.key === 'ArrowLeft') {
                setActiveImg((prev) => (prev === 0 ? images - 1 : prev - 1));
            } else if (e.key === 'ArrowRight') {
                setActiveImg((prev) => (prev === images - 1 ? 0 : prev + 1));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [product]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get(`/public/products/${slug}`);
                setProduct(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [slug]);

    useEffect(() => {
        if (!product || !product.id) return;
        const fetchRelated = async () => {
            try {
                const res = await api.get(`/public/products/${product.id}/related`);
                setRelated(res.data);
            } catch (e) {
                console.error(e);
            }
        };
        fetchRelated();
    }, [product]);

    if (loading)
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <div className='flex flex-col items-center gap-3 text-gray-400'>
                    <div className='w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin' />
                    <span className='text-sm'>Loading product...</span>
                </div>
            </div>
        );

    if (!product) {
        navigate('/404', { replace: true });
        return;
    }

    const {
        id,
        variantName,
        averageRating,
        basePrice,
        salePrice,
        viewCount,
        stockQuantity,
        warrantyMonths,
        brand,
        status,
        category,
        imageList,
        description,
        summary,
        attributes,
        isFeatured,
        createdAt
    } = product;

    const pct = discountPct(basePrice, salePrice);
    const isActive = status === 'ACTIVE';
    const hasDiscount = pct > 0;
    const outOfStock = stockQuantity === 0;
    const unavailable = !isActive || outOfStock;
    const images = imageList?.sort((a, b) => a.displayOrder - b.displayOrder) ?? [];

    // Breadcrumb
    const crumbs = [
        { label: 'Home', path: '/' },
        { label: category?.parentSlug, path: `/category/${category?.parentSlug ?? category.name}` },
        {
            label: category?.name,
            path: `/category/${category?.parentSlug ?? category.name}?categoryIds=${category?.id}`
        },
        {
            label: brand?.name,
            path: `/category/${category?.parentSlug ?? category.name}?brandIds=${brand?.id}`
        },
        { label: variantName, path: null }
    ];

    return (
        <div className='bg-white min-h-screen'>
            <div className='max-w-6xl mx-auto px-4 py-6'>
                {/* Breadcrumb */}
                <nav className='flex items-center gap-1.5 text-sm text-gray-400 mb-6 flex-wrap'>
                    {crumbs
                        .filter((c) => c.label)
                        .map((c, i, arr) => (
                            <React.Fragment key={i}>
                                <span
                                    className={
                                        i === arr.length - 1
                                            ? 'text-gray-600 font-medium truncate max-w-sm'
                                            : 'hover:text-[#045fae] cursor-pointer transition-colors'
                                    }
                                >
                                    {i < arr.length - 1 && c.path ? (
                                        <Link to={c.path}>{c.label}</Link>
                                    ) : (
                                        c.label
                                    )}
                                </span>

                                {i < arr.length - 1 && (
                                    <FontAwesomeIcon
                                        icon={faChevronRight}
                                        style={{ fontSize: 9 }}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                </nav>

                {/* Main grid */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12'>
                    {/* Left — images carousel */}
                    <div className='flex flex-col gap-3'>
                        {/* Main image with navigation */}
                        <div className='relative bg-gray-50 rounded-2xl overflow-hidden aspect-square flex items-center justify-center border border-gray-100 group'>
                            {images[activeImg] && !hasImageError ? (
                                <img
                                    src={resolveUrl(images[activeImg].imageUrl)}
                                    alt={variantName}
                                    onError={() => setHasImageError(true)}
                                    className={`w-full h-full object-cover transition-transform duration-300 ${!isActive ? 'grayscale' : ''}`}
                                />
                            ) : (
                                <FontAwesomeIcon
                                    icon={faBoxOpen}
                                    style={{ fontSize: 64, color: '#D1D5DB' }}
                                />
                            )}

                            {/* Badge góc trái — ưu tiên: Discontinued > Featured */}
                            {!isActive ? (
                                <div className='absolute inset-0 bg-black-40 flex items-center justify-center'>
                                    <span className='bg-gray-500 text-white text-lg font-medium px-3 py-2 rounded-lg'>
                                        Discontinued
                                    </span>
                                </div>
                            ) : isFeatured ? (
                                <span className='absolute top-3 left-3 text-xs font-medium px-2 py-1 rounded-lg bg-yellow-50 text-yellow-700'>
                                    Featured
                                </span>
                            ) : null}

                            {/* Discount badge — chỉ hiện khi ACTIVE */}
                            {hasDiscount && isActive && (
                                <span className='absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-lg bg-amber-50 text-amber-700'>
                                    -{pct}%
                                </span>
                            )}

                            {/* Overlay — ưu tiên: Discontinued > Out of stock */}
                            {!isActive ? (
                                <div className='absolute inset-0 bg-gray-400/30 rounded-2xl' />
                            ) : outOfStock ? (
                                <div className='absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl'>
                                    <span className='bg-white text-red-600 text-sm font-semibold px-4 py-2 rounded-lg'>
                                        Out of stock
                                    </span>
                                </div>
                            ) : null}

                            {/* Left/Right navigation arrows */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() =>
                                            setActiveImg((prev) =>
                                                prev === 0 ? images.length - 1 : prev - 1
                                            )
                                        }
                                        className='absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2.5 transition-all opacity-0 group-hover:opacity-100 z-10'
                                        title='Previous image (← keyboard)'
                                    >
                                        <FontAwesomeIcon
                                            icon={faChevronLeft}
                                            style={{ fontSize: 16 }}
                                        />
                                    </button>
                                    <button
                                        onClick={() =>
                                            setActiveImg((prev) =>
                                                prev === images.length - 1 ? 0 : prev + 1
                                            )
                                        }
                                        className='absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2.5 transition-all opacity-0 group-hover:opacity-100 z-10'
                                        title='Next image (→ keyboard)'
                                    >
                                        <FontAwesomeIcon
                                            icon={faChevronRight}
                                            style={{ fontSize: 16 }}
                                        />
                                    </button>
                                </>
                            )}

                            {/* Image counter */}
                            {images.length > 1 && (
                                <span className='absolute bottom-3 right-3 bg-black/50 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg'>
                                    {activeImg + 1} / {images.length}
                                </span>
                            )}
                        </div>

                        {/* Thumbnails with scroll */}
                        {images.length > 1 && (
                            <div className='flex flex-col gap-2'>
                                <div className='flex items-center gap-2'>
                                    {images.length > 4 && (
                                        <button
                                            onClick={() => {
                                                const container =
                                                    document.getElementById('thumbnails-container');
                                                container?.scrollBy({
                                                    left: -72,
                                                    behavior: 'smooth'
                                                });
                                                setThumbnailScrollPos((prev) =>
                                                    Math.max(0, prev - 72)
                                                );
                                            }}
                                            className='flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors'
                                            title='Scroll left'
                                        >
                                            <FontAwesomeIcon
                                                icon={faChevronLeft}
                                                style={{ fontSize: 14, color: '#6B7280' }}
                                            />
                                        </button>
                                    )}
                                    <div
                                        id='thumbnails-container'
                                        className='flex gap-2 overflow-x-auto flex-1 scrollbar-hide'
                                        style={{ scrollBehavior: 'smooth' }}
                                    >
                                        {images.map((img, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    setHasImageError(false);
                                                    setActiveImg(i);
                                                }}
                                                className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all hover:shadow-md
													${activeImg === i ? 'border-blue-500 ring-1 ring-blue-300' : 'border-gray-200 hover:border-gray-400'}`}
                                                title={`View image ${i + 1}`}
                                            >
                                                <img
                                                    src={resolveUrl(img.imageUrl)}
                                                    alt={`view ${i + 1}`}
                                                    className='w-full h-full object-cover'
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    {images.length > 4 && (
                                        <button
                                            onClick={() => {
                                                const container =
                                                    document.getElementById('thumbnails-container');
                                                container?.scrollBy({
                                                    left: 72,
                                                    behavior: 'smooth'
                                                });
                                                setThumbnailScrollPos((prev) => prev + 72);
                                            }}
                                            className='flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors'
                                            title='Scroll right'
                                        >
                                            <FontAwesomeIcon
                                                icon={faChevronRight}
                                                style={{ fontSize: 14, color: '#6B7280' }}
                                            />
                                        </button>
                                    )}
                                </div>
                                <p className='text-xs text-gray-500 text-center'>
                                    Use arrow keys to navigate
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right — info */}
                    <div className='flex flex-col gap-4'>
                        {/* Brand */}
                        <div className='flex items-center gap-2'>
                            {brand?.logoUrl && (
                                <img
                                    src={resolveUrl(brand.logoUrl)}
                                    alt={brand.name}
                                    className='h-5 object-contain'
                                />
                            )}
                            <span className='text-xs font-medium text-gray-400 uppercase tracking-wide'>
                                {brand?.name}
                            </span>
                            <span className='text-gray-200'>•</span>
                            <span className='text-xs text-gray-400'>{category?.name}</span>
                        </div>

                        {/* Title */}
                        <h1 className='text-2xl font-bold text-gray-900 leading-snug'>
                            {product.productGroup?.name + ' ' + variantName}
                        </h1>
                        {/* Rating + views */}
                        <div className='flex items-center gap-4 flex-wrap'>
                            <StarRating rating={averageRating} />
                            <span className='flex items-center gap-1 text-xs text-gray-400'>
                                <FontAwesomeIcon icon={faEye} style={{ fontSize: 11 }} />
                                {viewCount?.toLocaleString()} views
                            </span>
                        </div>
                        {/* Related Products — below rating */}
                        {related && related.length > 0 && (
                            <div className='mt-3 pt-3 border-t border-gray-200'>
                                <p className='text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2'>
                                    Product Variants
                                </p>
                                <div className='flex gap-2 flex-wrap'>
                                    {related.map((relatedProduct) => (
                                        <a
                                            key={relatedProduct.id}
                                            href={`/products/${relatedProduct.slug}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.location.href = `/products/${relatedProduct.slug}`;
                                            }}
                                            className={`flex items-center gap-2 px-1 py-1 rounded-lg border-2 transition-all hover:shadow-md hover:-translate-y-0.5
										${
                                            product.id === relatedProduct.id
                                                ? 'border-blue-600 bg-blue-50 hover:bg-blue-100 shadow-sm'
                                                : 'border-gray-200 bg-white hover:border-blue-400'
                                        }`}
                                        >
                                            {/* Small image thumbnail */}
                                            <div className='w-15 h-15 rounded-sm overflow-hidden bg-gray-50 flex-shrink-0'>
                                                {relatedProduct.imageList?.[0] ? (
                                                    <img
                                                        src={resolveUrl(
                                                            relatedProduct.imageList[0].imageUrl
                                                        )}
                                                        alt={relatedProduct.variantName}
                                                        className='w-full h-full object-cover'
                                                    />
                                                ) : (
                                                    <FontAwesomeIcon
                                                        icon={faBoxOpen}
                                                        style={{ fontSize: 16, color: '#D1D5DB' }}
                                                    />
                                                )}
                                            </div>

                                            {/* Product details */}
                                            <div className='flex flex-col'>
                                                <span className='text-sm font-medium text-gray-900 truncate max-w-[120px]'>
                                                    {relatedProduct.variantName}
                                                </span>
                                                <span className='text-sm font-semibold text-blue-600'>
                                                    {relatedProduct.salePrice?.toLocaleString(
                                                        'en-US',
                                                        {
                                                            style: 'currency',
                                                            currency: 'USD'
                                                        }
                                                    )}
                                                </span>
                                            </div>

                                            {/* Checkmark for current product */}
                                            {/* {product.id === relatedProduct.id && <span className="flex-shrink-0 text-red-500 font-bold">✓</span>} */}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Price box */}
                        <div className='bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100'>
                            <div className='flex items-baseline gap-3 mb-2'>
                                <span
                                    className={`text-3xl font-bold ${hasDiscount && isActive ? 'text-orange-600' : 'text-gray-900'}`}
                                >
                                    {fmtPrice(salePrice)}
                                </span>
                                {hasDiscount && isActive && (
                                    <>
                                        <span className='text-base text-gray-400 line-through'>
                                            {fmtPrice(basePrice)}
                                        </span>
                                        <span className='text-sm font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg'>
                                            Save {fmtPrice(basePrice - salePrice)}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Status indicator */}
                            {!isActive ? (
                                <div className='flex items-center gap-1.5'>
                                    <span className='w-2 h-2 rounded-full bg-gray-400' />
                                    <span className='text-sm font-medium text-gray-500'>
                                        Discontinued — no longer available
                                    </span>
                                </div>
                            ) : outOfStock ? (
                                <div className='flex items-center gap-1.5'>
                                    <span className='w-2 h-2 rounded-full bg-red-400' />
                                    <span className='text-sm font-medium text-red-500'>
                                        Out of Stock
                                    </span>
                                </div>
                            ) : (
                                <div className='flex items-center gap-1.5'>
                                    <span className='w-2 h-2 rounded-full bg-emerald-400' />
                                    <span className='text-sm font-medium text-emerald-600'>
                                        In Stock — {stockQuantity} units available
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        {summary && (
                            <p className='text-sm text-gray-600 leading-relaxed'>{summary}</p>
                        )}

                        {/* Qty + buttons */}
                        <div className='flex flex-col gap-3'>
                            {/* Quantity picker */}
                            <div className='flex items-center gap-3'>
                                <span className='text-sm text-gray-500'>Quantity</span>
                                <div
                                    className={`flex items-center border rounded-xl overflow-hidden
        ${unavailable ? 'border-gray-100 opacity-40' : 'border-gray-200'}`}
                                >
                                    <button
                                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                                        disabled={unavailable || qty <= 1}
                                        className={`w-9 h-9 flex items-center justify-center transition-colors
				${unavailable || qty <= 1 ? 'text-gray-500 hover:bg-gray-100 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer text-white'}`}
                                    >
                                        <FontAwesomeIcon icon={faMinus} style={{ fontSize: 14 }} />
                                    </button>
                                    <input
                                        type='text'
                                        min='1'
                                        max={stockQuantity}
                                        value={qty}
                                        onChange={(e) => {
                                            if (!/^\d*$/.test(e.target.value)) return;
                                            if (e.target.value > stockQuantity) {
                                                setQty(stockQuantity);
                                            } else if (e.target.value < 1) {
                                                setQty(1);
                                            } else {
                                                setQty(parseInt(e.target.value));
                                            }
                                        }}
                                        className='w-10 text-center text-sm font-medium text-gray-800 border-none focus:ring-2 focus:ring-blue-500'
                                        disabled={unavailable}
                                    />
                                    <button
                                        onClick={() =>
                                            setQty((q) => Math.min(stockQuantity, q + 1))
                                        }
                                        disabled={unavailable || qty >= stockQuantity}
                                        className={`w-9 h-9 flex items-center justify-center transition-colors
				${unavailable || qty >= stockQuantity ? 'text-gray-500 hover:bg-gray-100 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer text-white'}`}
                                    >
                                        <FontAwesomeIcon icon={faPlus} style={{ fontSize: 14 }} />
                                    </button>
                                </div>
                            </div>

                            {/* CTA buttons */}
                            <div className='flex gap-2'>
                                <AddToCartButton
                                    productId={id}
                                    quantity={qty}
                                    showText={false}
                                    disabled={unavailable}
                                    stock={stockQuantity}
                                    product={product}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-lg text-blue-600 border-2 border-blue-600 font-semibold transition-all
            ${
                unavailable
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
                                ></AddToCartButton>
                                <BuyNowButton
                                    product={product}
                                    quantity={qty}
                                    unavailable={unavailable}
                                    // disabled={product.stockQuantity <= 0}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all
            ${
                unavailable
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
                                >
                                    <FontAwesomeIcon icon={faBolt} />
                                    Buy Now
                                </BuyNowButton>
                            </div>
                        </div>

                        {/* Perks */}
                        <div className='grid grid-cols-2 gap-2 pt-1'>
                            <div className='flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5'>
                                <FontAwesomeIcon
                                    icon={faTruck}
                                    style={{ fontSize: 13, color: '#3B82F6' }}
                                />
                                Free Shipping
                            </div>
                            {warrantyMonths && (
                                <div className='flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5'>
                                    <FontAwesomeIcon
                                        icon={faShield}
                                        style={{ fontSize: 13, color: '#3B82F6' }}
                                    />
                                    {warrantyMonths}-Month Warranty
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Description */}
                {description && (
                    <div className='mb-10'>
                        <h2 className='text-lg font-semibold text-gray-800 mb-3'>
                            About this product
                        </h2>
                        <p className='text-sm text-gray-600 leading-relaxed max-w-3xl'>
                            {description}
                        </p>
                    </div>
                )}

                {/* Technical Specifications */}
                {attributes?.length > 0 && (
                    <div className='mb-12'>
                        <h2 className='text-lg font-semibold text-gray-800 mb-4'>
                            Technical Specifications
                        </h2>
                        <table className='table-auto border rounded-xl overflow-hidden text-left text-sm border-gray-200 w-full bg-gray-300'>
                            <tbody>
                                {attributes.map((attr, i) => (
                                    <tr
                                        key={i}
                                        className={`border-b border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                    >
                                        <td className='py-3.5 px-5 text-sm font-medium text-gray-700 border border-gray-100'>
                                            {attr.name}
                                        </td>
                                        <td className='py-3.5 px-5 text-sm text-gray-600 border border-gray-100'>
                                            {attr.attrValue}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Customer Reviews placeholder */}
                <CustomerReviewsSection productId={product?.id} />

                {/* Q&A Section */}
                <QuestionAnswerSection productId={product?.id} />
            </div>
        </div>
    );
}
