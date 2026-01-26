using System.ComponentModel.DataAnnotations;

namespace GroceryOrderSystem.API.DTOs;

public class CreateOrderDto
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "ProductId must be greater than 0")]
    public int ProductId { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
    public int Quantity { get; set; }
}