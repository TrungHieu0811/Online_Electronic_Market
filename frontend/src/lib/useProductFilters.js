import {useEffect, useState, useCallback} from 'react';
import {useSearchParams} from 'react-router-dom';

const PAGE_SIZE = 12;

/**
 * Custom hook for managing product filters, search, and sorting
 * Reusable across user pages and admin pages
 * @param {Object} options Configuration options
 * @param {Array} options.sortOptions - Available sort options
 * @param {Array} options.priceOptions - Available price sort options
 * @param {Array} options.stockOptions - Available stock sort options (optional)
 * @param {boolean} options.enableStock - Enable stock sorting (default: false)
 * @returns {Object} Filter state and handlers
 */
export function useProductFilters(options = {}) {
	const {
		sortOptions = [],
		priceOptions = [],
		stockOptions = [],
		enableStock = false,
	} = options;

	const [searchParams, setSearchParams] = useSearchParams();
	const [searchInput, setSearchInput] = useState('');
	const [minPriceInput, setMinPriceInput] = useState('');
	const [maxPriceInput, setMaxPriceInput] = useState('');
	const [selectedBrands, setSelectedBrands] = useState([]);
	const [selectedCategories, setSelectedCategories] = useState([]);

	// Initialize from URL on mount
	useEffect(() => {
		setSearchInput(searchParams.get('keyword') || searchParams.get('q') || '');
		setMinPriceInput(searchParams.get('minPrice') || '');
		setMaxPriceInput(searchParams.get('maxPrice') || '');
		setSelectedBrands(
			searchParams.get('brandIds')
				? searchParams.get('brandIds').split(',').filter(Boolean)
				: [],
		);
		setSelectedCategories(
			searchParams.get('categoryIds')
				? searchParams.get('categoryIds').split(',').filter(Boolean)
				: [],
		);
	}, []);

	// Get current values from URL
	const currentPage = parseInt(searchParams.get('page') || '0');
	const currentSort = searchParams.get('sort') || (sortOptions.length > 0 ? sortOptions[0].value : 'createdAt,desc');
	const currentSearch = searchParams.get('keyword') || searchParams.get('q') || '';

	// Update a URL parameter
	const updateParam = useCallback((key, value) => {
		setSearchParams((prev) => {
			if (value === '' || value === null || value === undefined) {
				prev.delete(key);
			} else {
				prev.set(key, value);
			}
			if (key !== 'page') {
				prev.set('page', '0');
			}
			return prev;
		});
	}, [setSearchParams]);

	// Handle search submission
	const handleSearch = useCallback((e) => {
		if (e) e.preventDefault();
		updateParam('keyword', searchInput.trim() || '');
	}, [searchInput, updateParam]);

	// Handle clear search
	const handleClearSearch = useCallback(() => {
		setSearchInput('');
		updateParam('keyword', '');
	}, [updateParam]);

	// Handle brand filter toggle
	const handleBrandChange = useCallback((brandId) => {
		const updated = selectedBrands.includes(brandId)
			? selectedBrands.filter((id) => id !== brandId)
			: [...selectedBrands, brandId];
		setSelectedBrands(updated);
		updateParam('brandIds', updated.length > 0 ? updated.join(',') : '');
	}, [selectedBrands, updateParam]);

	// Handle category filter toggle
	const handleCategoryChange = useCallback((categoryId) => {
		const updated = selectedCategories.includes(categoryId)
			? selectedCategories.filter((id) => id !== categoryId)
			: [...selectedCategories, categoryId];
		setSelectedCategories(updated);
		updateParam('categoryIds', updated.length > 0 ? updated.join(',') : '');
	}, [selectedCategories, updateParam]);

	// Handle price filter apply
	const handleApplyPriceFilter = useCallback(() => {
		if (minPriceInput) updateParam('minPrice', minPriceInput);
		if (maxPriceInput) updateParam('maxPrice', maxPriceInput);
	}, [minPriceInput, maxPriceInput, updateParam]);

	// Clear all filters
	const handleClearAllFilters = useCallback(() => {
		setSearchInput('');
		setMinPriceInput('');
		setMaxPriceInput('');
		setSelectedBrands([]);
		setSelectedCategories([]);
		setSearchParams((prev) => {
			prev.delete('keyword');
			prev.delete('q');
			prev.delete('minPrice');
			prev.delete('maxPrice');
			prev.delete('brandIds');
			prev.delete('categoryIds');
			prev.set('page', '0');
			return prev;
		});
	}, [setSearchParams]);

	// Build API params for fetching
	const buildApiParams = useCallback(
		(additionalParams = {}) => {
			const sortParts = currentSort.split(',');
			const params = {
				page: currentPage,
				size: PAGE_SIZE,
				...(currentSearch && {keyword: currentSearch}),
				...(selectedBrands.length > 0 && {brandIds: selectedBrands.join(',')}),
				...(selectedCategories.length > 0 && {categoryIds: selectedCategories.join(',')}),
				...(minPriceInput && {minPrice: minPriceInput}),
				...(maxPriceInput && {maxPrice: maxPriceInput}),
				...additionalParams,
			};

			// Handle multi-criteria sort (separated by ;)
			if (currentSort.includes(';')) {
				params.sort = currentSort.split(';');
			} else {
				params.sort = currentSort;
			}

			return params;
		},
		[currentPage, currentSort, currentSearch, selectedBrands, selectedCategories, minPriceInput, maxPriceInput],
	);

	// Check if any filters are active
	const hasActiveFilters = currentSearch || selectedBrands.length > 0 || selectedCategories.length > 0 || minPriceInput || maxPriceInput;

	return {
		// State
		searchInput,
		setSearchInput,
		minPriceInput,
		setMinPriceInput,
		maxPriceInput,
		setMaxPriceInput,
		selectedBrands,
		setSelectedBrands,
		selectedCategories,
		setSelectedCategories,

		// Current values from URL
		currentPage,
		currentSort,
		currentSearch,

		// Handlers
		updateParam,
		handleSearch,
		handleClearSearch,
		handleBrandChange,
		handleCategoryChange,
		handleApplyPriceFilter,
		handleClearAllFilters,
		buildApiParams,
		hasActiveFilters,

		// Utils
		PAGE_SIZE,
	};
}
