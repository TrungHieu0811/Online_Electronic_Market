import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
    faPlus
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarEmpty, faHeart } from '@fortawesome/free-regular-svg-icons';
import api from '../../services/api';
import QuestionAnswerSection from '@/features/comment/QuestionAnswerSection';
import AddToCartButton from '../user/cart/AddToCartButton';

const IMAGE_BASE_URL = 'http://localhost:8080/uploads';

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
                {snapped.toFixed(1)}
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
    const [loading, setLoading] = useState(true);
    const [activeImg, setActiveImg] = useState(0);
    const [qty, setQty] = useState(1);
    const [wishlisted, setWishlisted] = useState(false);

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

    if (loading)
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <div className='flex flex-col items-center gap-3 text-gray-400'>
                    <div className='w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin' />
                    <span className='text-sm'>Loading product...</span>
                </div>
            </div>
        );

    if (!product)
        return (
            <div className='min-h-screen flex items-center justify-center text-gray-400'>
                Product not found.
            </div>
        );

    const {
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
    const crumbs = ['Home', brand?.name, category?.name, variantName];

    return (
        <div className='bg-white min-h-screen'>
            <div className='max-w-6xl mx-auto px-4 py-6'>
                {/* Breadcrumb */}
                <nav className='flex items-center gap-1.5 text-xs text-gray-400 mb-6 flex-wrap'>
                    {crumbs.filter(Boolean).map((c, i, arr) => (
                        <React.Fragment key={i}>
                            <span
                                className={
                                    i === arr.length - 1
                                        ? 'text-gray-600 font-medium truncate max-w-xs'
                                        : 'hover:text-gray-600 cursor-pointer'
                                }
                            >
                                {c}
                            </span>
                            {i < arr.length - 1 && (
                                <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
                            )}
                        </React.Fragment>
                    ))}
                </nav>

                {/* Main grid */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12'>
                    {/* Left — images */}
                    <div className='flex flex-col gap-3'>
                        {/* Main image */}
                        <div className='relative bg-gray-50 rounded-2xl overflow-hidden aspect-square flex items-center justify-center border border-gray-100'>
                            {images[activeImg] ? (
                                <img
                                    src={resolveUrl(images[activeImg].imageUrl)}
                                    alt={variantName}
                                    className={`w-full h-full object-cover ${!isActive ? 'grayscale' : ''}`}
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
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className='flex gap-2 flex-wrap'>
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImg(i)}
                                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all
											${activeImg === i ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <img
                                            src={resolveUrl(img.imageUrl)}
                                            alt={`view ${i + 1}`}
                                            className='w-full h-full object-cover'
                                        />
                                    </button>
                                ))}
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
                            {variantName}
                        </h1>

                        {/* Rating + views */}
                        <div className='flex items-center gap-4 flex-wrap'>
                            <StarRating rating={averageRating} />
                            <span className='flex items-center gap-1 text-xs text-gray-400'>
                                <FontAwesomeIcon icon={faEye} style={{ fontSize: 11 }} />
                                {viewCount?.toLocaleString()} views
                            </span>
                        </div>

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
                                        disabled={unavailable}
                                        className='w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500 disabled:cursor-not-allowed'
                                    >
                                        <FontAwesomeIcon icon={faMinus} style={{ fontSize: 11 }} />
                                    </button>
                                    <span className='w-10 text-center text-sm font-medium text-gray-800'>
                                        {qty}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setQty((q) => Math.min(stockQuantity, q + 1))
                                        }
                                        disabled={unavailable}
                                        className='w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500 disabled:cursor-not-allowed'
                                    >
                                        <FontAwesomeIcon icon={faPlus} style={{ fontSize: 11 }} />
                                    </button>
                                </div>
                            </div>

                            {/* CTA buttons */}
                            <div className='flex gap-2'>
                                <AddToCartButton productId={product.id} quantity={qty} stock={product.stockQuantity} product={product}
                                    disabled={unavailable}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 border-blue-600 transition-all
            ${
                unavailable
                    ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                    : 'text-blue-600 hover:bg-blue-600 hover:text-white active:scale-95'
            }`}
                                >
                                    <FontAwesomeIcon icon={faCartPlus} />
                                    Add to Cart
                                </AddToCartButton>
                                <button
                                    disabled={unavailable}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all
            ${
                unavailable
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
                                >
                                    <FontAwesomeIcon icon={faBolt} />
                                    Buy Now
                                </button>
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
                        <div className='border border-gray-200 rounded-2xl overflow-hidden'>
                            {attributes.map((attr, i) => (
                                <div
                                    key={i}
                                    className={`flex items-start gap-4 px-5 py-3.5 text-sm
										${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
										${i < attributes.length - 1 ? 'border-b border-gray-100' : ''}`}
                                >
                                    <span className='w-36 flex-shrink-0 font-medium text-gray-700'>
                                        {attr.name}
                                    </span>
                                    <span className='text-gray-600'>{attr.attrValue}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Customer Reviews placeholder */}
                <div className='mb-12'>
                    <h2 className='text-lg font-semibold text-gray-800 mb-4'>Customer Reviews</h2>
                    <div className='border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center py-16 text-gray-400'>
                        <div className='text-center'>
                            <FontAwesomeIcon
                                icon={faStar}
                                style={{ fontSize: 28, color: '#E5E7EB', marginBottom: 8 }}
                            />
                            <p className='text-sm'>Reviews section — coming soon</p>
                        </div>
                    </div>
                </div>

                {/* Q&A Section */}
                <QuestionAnswerSection productId={product?.id} />
            </div>
        </div>
    );
}
