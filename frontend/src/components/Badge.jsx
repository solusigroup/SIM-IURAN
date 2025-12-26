/**
 * Badge Component
 * Status badges with different color variants
 */

const variants = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800',
};

export default function Badge({ children, variant = 'gray', className = '' }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
}

// Status badge helper untuk tagihan
export function StatusBadge({ status }) {
    const config = {
        'lunas': { variant: 'success', label: 'Lunas' },
        'sebagian': { variant: 'warning', label: 'Sebagian' },
        'belum_lunas': { variant: 'danger', label: 'Belum Lunas' },
    };

    const { variant, label } = config[status] || { variant: 'gray', label: status };
    return <Badge variant={variant}>{label}</Badge>;
}

// Status badge untuk user role
export function RoleBadge({ role }) {
    const config = {
        'admin': { variant: 'info', label: 'Admin' },
        'warga': { variant: 'gray', label: 'Warga' },
    };

    const { variant, label } = config[role] || { variant: 'gray', label: role };
    return <Badge variant={variant}>{label}</Badge>;
}

// Status badge untuk status huni
export function StatusHuniBadge({ status }) {
    const config = {
        'tetap': { variant: 'success', label: 'Tetap' },
        'kontrak': { variant: 'warning', label: 'Kontrak' },
    };

    const { variant, label } = config[status] || { variant: 'gray', label: status };
    return <Badge variant={variant}>{label}</Badge>;
}
