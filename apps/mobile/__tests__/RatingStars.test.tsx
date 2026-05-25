import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import RatingStars from '../components/RatingStars';

describe('RatingStars', () => {
  it('renders 5 stars', () => {
    render(<RatingStars rating={3} />);
    const stars = screen.getAllByText('★');
    expect(stars).toHaveLength(5);
  });

  it('does not call onChange when not interactive', () => {
    const onChange = jest.fn();
    render(<RatingStars rating={3} interactive={false} onChange={onChange} />);
    const stars = screen.getAllByText('★');
    fireEvent.press(stars[0]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onChange with correct star value when interactive', () => {
    const onChange = jest.fn();
    render(<RatingStars rating={0} interactive onChange={onChange} />);
    const stars = screen.getAllByText('★');
    fireEvent.press(stars[2]);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('calls onChange with star 1 when first star pressed', () => {
    const onChange = jest.fn();
    render(<RatingStars rating={0} interactive onChange={onChange} />);
    const stars = screen.getAllByText('★');
    fireEvent.press(stars[0]);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('calls onChange with star 5 when last star pressed', () => {
    const onChange = jest.fn();
    render(<RatingStars rating={0} interactive onChange={onChange} />);
    const stars = screen.getAllByText('★');
    fireEvent.press(stars[4]);
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('uses custom size when provided', () => {
    const { toJSON } = render(<RatingStars rating={3} size={24} />);
    const json = JSON.stringify(toJSON());
    expect(json).toContain('24');
  });
});
